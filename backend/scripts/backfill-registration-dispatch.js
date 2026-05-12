const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

const PLAQUE_TASK_TYPES = new Set(['PLAQUE', 'LONGEVITY', 'DELIVERANCE', 'REBIRTH'])
const LAMP_TASK_TYPES = new Set(['LAMP', 'LAMPOFFERING'])

function parseArgs(argv) {
  const args = {
    dryRun: true,
    taskType: null,
    requestId: null,
    limit: null,
  }

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i]
    if (arg === '--write') args.dryRun = false
    else if (arg === '--dry-run') args.dryRun = true
    else if (arg === '--taskType') args.taskType = argv[++i] || null
    else if (arg === '--requestId') args.requestId = argv[++i] || null
    else if (arg === '--limit') args.limit = Number(argv[++i] || 0) || null
  }

  return args
}

function toDate(value, fallback = null) {
  if (!value || ['undefined', 'null', ''].includes(value)) return fallback
  const parsed = new Date(value)
  return Number.isNaN(parsed.getTime()) ? fallback : parsed
}

function normalizeVolunteerPayload(data, request) {
  const payload = {
    name: data.name || request.submitterName,
    dharmaName: data.dharmaName,
    gender: data.gender,
    phone: data.phone || request.submitterPhone,
    address: data.address,
    ethnicity: data.ethnicity,
    education: data.education,
    emergencyContact: data.emergencyContact,
    currentOccupation: data.currentOccupation,
    healthStatus: data.healthStatus,
    hasInfectiousDisease: data.hasInfectiousDisease,
    hasAllergy: data.hasAllergy,
    hasSpecialNeeds: data.hasSpecialNeeds,
    firstContactBuddhism: data.firstContactBuddhism,
    hasTakenRefuge: data.hasTakenRefuge,
    willingToLearn: data.willingToLearn,
    guidanceHope: data.guidanceHope,
    hasVolunteerExperience: data.hasVolunteerExperience,
    lastVolunteerLocation: data.lastVolunteerLocation,
    lastVolunteerContent: data.lastVolunteerContent,
    serviceDuration: data.serviceDuration,
    signature: data.signature,
  }

  for (const key of ['preceptsHeld', 'skills']) {
    if (Array.isArray(data[key]) && data[key].length > 0) payload[key] = data[key]
    else if (typeof data[key] === 'string' && data[key] !== '') payload[key] = [data[key]]
  }

  for (const key of ['volunteerTimes']) {
    const value = data[key]
    if (value !== undefined && value !== null && value !== '') {
      const parsed = Number(value)
      if (!Number.isNaN(parsed)) payload[key] = parsed
    }
  }

  for (const key of ['birthDate', 'refugeTime', 'lastVolunteerDate', 'serviceStartDate', 'serviceEndDate']) {
    const parsed = toDate(data[key])
    if (parsed) payload[key] = parsed
  }

  for (const [key, value] of Object.entries(payload)) {
    if (value === undefined || value === null || value === '') delete payload[key]
  }

  return payload
}

async function plaqueAlreadyExists(data, request) {
  const where = {
    plaqueType: data.plaqueType || (request.taskType === 'REBIRTH' ? 'REBIRTH' : request.taskType === 'DELIVERANCE' ? 'DELIVERANCE' : 'LONGEVITY'),
    yangShang: data.yangShang || request.submitterName,
    phone: data.phone || request.submitterPhone,
    startDate: toDate(data.startDate, request.approvedAt || request.createdAt),
  }

  if (where.plaqueType === 'LONGEVITY') where.holderName = data.holderName || null
  else where.deceasedName = data.deceasedName || null

  return prisma.memorialPlaque.findFirst({ where })
}

async function lampAlreadyExists(data, request) {
  return prisma.lampOffering.findFirst({
    where: {
      name: data.name || request.submitterName,
      phone: data.phone || request.submitterPhone,
      lampType: data.lampType || '',
      blessingName: data.blessingName || null,
      startDate: toDate(data.startDate, request.approvedAt || request.createdAt),
    }
  })
}

async function volunteerSignupExists(data, request) {
  if (!data.volunteerTaskId) return null
  return prisma.volunteerSignup.findFirst({
    where: {
      taskId: data.volunteerTaskId,
      volunteerPhone: data.phone || request.submitterPhone,
      volunteerName: data.name || request.submitterName,
    }
  })
}

async function processRequest(request, options) {
  const data = request.formData && typeof request.formData === 'object' ? request.formData : {}
  const actions = []

  if (PLAQUE_TASK_TYPES.has(request.taskType)) {
    const existing = await plaqueAlreadyExists(data, request)
    if (existing) return { request, status: 'skip', reason: `plaque exists:${existing.id}` }

    const payload = {
      plaqueType: data.plaqueType || (request.taskType === 'REBIRTH' ? 'REBIRTH' : request.taskType === 'DELIVERANCE' ? 'DELIVERANCE' : 'LONGEVITY'),
      holderName: data.holderName,
      deceasedName: data.deceasedName,
      deceasedName2: data.deceasedName2,
      birthDate2: data.birthDate2,
      deathDate2: data.deathDate2,
      zodiac2: data.zodiac2,
      gender2: data.gender2,
      gender: data.gender,
      zodiac: data.zodiac,
      birthDate: data.birthDate,
      birthLunar: Array.isArray(data.birthLunar) && data.birthLunar.includes('1'),
      deathDate: data.deathDate,
      deathLunar: Array.isArray(data.deathLunar) && data.deathLunar.includes('1'),
      yangShang: data.yangShang || request.submitterName,
      phone: data.phone || request.submitterPhone,
      address: data.address,
      dedicationType: data.dedicationType === 'custom' ? (data.customDedicationType || data.dedicationType) : data.dedicationType,
      longevitySubtype: data.longevitySubtype,
      size: data.size,
      blessingText: data.blessingText,
      startDate: toDate(data.startDate, request.approvedAt || request.createdAt || new Date()),
      endDate: toDate(data.endDate, new Date((request.approvedAt || request.createdAt || new Date()).getTime() + 365 * 24 * 60 * 60 * 1000)),
      ritualId: data.ritualId || null,
    }

    actions.push({ type: 'plaque', payload })
  } else if (LAMP_TASK_TYPES.has(request.taskType)) {
    const existing = await lampAlreadyExists(data, request)
    if (existing) return { request, status: 'skip', reason: `lamp exists:${existing.id}` }

    const payload = {
      name: data.name || request.submitterName,
      phone: data.phone || request.submitterPhone,
      lampType: data.lampType,
      location: data.location,
      blessingName: data.blessingName,
      blessingType: data.blessingType,
      amount: data.amount || 0,
      startDate: toDate(data.startDate, request.approvedAt || request.createdAt || new Date()),
      endDate: toDate(data.endDate, new Date((request.approvedAt || request.createdAt || new Date()).getTime() + 365 * 24 * 60 * 60 * 1000)),
    }

    actions.push({ type: 'lamp', payload })
  } else if (request.taskType === 'VOLUNTEER') {
    const volunteerPayload = normalizeVolunteerPayload(data, request)
    if (!volunteerPayload.phone) return { request, status: 'skip', reason: 'missing volunteer phone' }

    const existingVolunteer = await prisma.volunteer.findUnique({ where: { phone: volunteerPayload.phone } })
    actions.push({ type: existingVolunteer ? 'volunteer.update' : 'volunteer.create', payload: volunteerPayload, existingId: existingVolunteer?.id || null })

    if (data.volunteerTaskId) {
      const existingSignup = await volunteerSignupExists(data, request)
      if (!existingSignup) {
        actions.push({
          type: 'volunteerSignup',
          payload: {
            taskId: data.volunteerTaskId,
            volunteerName: volunteerPayload.name || request.submitterName,
            volunteerPhone: volunteerPayload.phone || request.submitterPhone,
            status: 'SIGNED_UP',
          }
        })
      }
    }

    if (actions.length === 1 && actions[0].type === 'volunteer.update') {
      return { request, status: 'skip', reason: `volunteer exists:${actions[0].existingId}` }
    }
  } else {
    return { request, status: 'skip', reason: `unsupported taskType:${request.taskType}` }
  }

  if (options.dryRun) return { request, status: 'plan', actions }

  const result = await prisma.$transaction(async (tx) => {
    let volunteerRecord = null
    for (const action of actions) {
      if (action.type === 'plaque') await tx.memorialPlaque.create({ data: action.payload })
      else if (action.type === 'lamp') await tx.lampOffering.create({ data: action.payload })
      else if (action.type === 'volunteer.create') volunteerRecord = await tx.volunteer.create({ data: action.payload })
      else if (action.type === 'volunteer.update') volunteerRecord = await tx.volunteer.update({ where: { phone: action.payload.phone }, data: action.payload })
      else if (action.type === 'volunteerSignup') {
        await tx.volunteerSignup.create({
          data: {
            ...action.payload,
            volunteerId: volunteerRecord?.id || (await tx.volunteer.findUnique({ where: { phone: action.payload.volunteerPhone } }))?.id || null,
          }
        })
        await tx.volunteerTask.update({
          where: { id: action.payload.taskId },
          data: { currentCount: { increment: 1 } }
        })
      }
    }
  })

  return { request, status: 'done', actions, result }
}

async function main() {
  const options = parseArgs(process.argv.slice(2))
  const where = { status: 'APPROVED' }
  if (options.taskType) where.taskType = options.taskType
  if (options.requestId) where.id = options.requestId

  const requests = await prisma.registrationRequest.findMany({
    where,
    orderBy: { approvedAt: 'asc' },
    take: options.limit || undefined,
  })

  console.log(`mode=${options.dryRun ? 'dry-run' : 'write'} count=${requests.length}`)

  let planned = 0
  let skipped = 0
  let done = 0
  for (const request of requests) {
    const result = await processRequest(request, options)
    if (result.status === 'skip') {
      skipped += 1
      console.log(`SKIP\t${request.id}\t${request.taskType}\t${result.reason}`)
    } else {
      if (result.status === 'plan') planned += 1
      if (result.status === 'done') done += 1
      console.log(`${result.status.toUpperCase()}\t${request.id}\t${request.taskType}\t${result.actions.map(a => a.type).join(',')}`)
    }
  }

  console.log(`summary\tplanned=${planned}\tdone=${done}\tskipped=${skipped}`)
}

main()
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
