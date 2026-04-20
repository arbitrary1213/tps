// 初始化数据库和默认管理员账号
const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

async function main() {
  console.log('开始初始化数据库...')

  try {
    // 创建管理员账号
    const adminEmail = 'admin@temple.os'
    const adminUsername = 'admin'
    const adminPassword = 'admin123'

    const existingAdmin = await prisma.user.findFirst({
      where: {
        OR: [{ username: adminUsername }, { email: adminEmail }]
      }
    })

    if (!existingAdmin) {
      const hashedPassword = await bcrypt.hash(adminPassword, 10)
      await prisma.user.create({
        data: {
          username: adminUsername,
          email: adminEmail,
          password: hashedPassword,
          name: '管理员',
          role: 'ADMIN',
        }
      })
      console.log('✅ 管理员账号已创建')
      console.log('   用户名:', adminUsername)
      console.log('   密码:', adminPassword)
      console.log('   邮箱:', adminEmail)
    } else {
      console.log('ℹ️  管理员账号已存在')
    }

    // 创建默认系统设置
    const existingSettings = await prisma.systemSettings.findUnique({
      where: { id: 'system' }
    })

    if (!existingSettings) {
      await prisma.systemSettings.create({
        data: {
          id: 'system',
          templeName: '仙顶寺',
          templeAddress: '',
          templePhone: '',
          templeLogo: '',
          landingLogo: '',
        }
      })
      console.log('✅ 系统设置已初始化')
    } else {
      console.log('ℹ️  系统设置已存在')
    }

    // 创建默认登记任务
    const existingTasks = await prisma.registrationTask.findMany()
    if (existingTasks.length === 0) {
      await prisma.registrationTask.createMany({
        data: [
          {
            name: '义工报名',
            taskType: 'VOLUNTEER',
            description: '招募寺院义工，协助日常事务',
            enabled: true,
            sort: 1,
            formConfig: {
              fields: ['name', 'phone', 'skills']
            }
          },
          {
            name: '延生禄位',
            taskType: 'PLAQUE',
            description: '为在世者供奉延生禄位',
            enabled: true,
            sort: 2,
            formConfig: {
              fields: ['holderName', 'zodiac', 'yangShang', 'phone', 'address', 'birthDate', 'startDate']
            }
          },
          {
            name: '往生莲位',
            taskType: 'PLAQUE',
            description: '为亡者供奉往生莲位',
            enabled: true,
            sort: 3,
            formConfig: {
              fields: ['deceasedName', 'yangShang', 'phone', 'address', 'deathDate', 'startDate']
            }
          },
          {
            name: '供灯祈福',
            taskType: 'LAMPOFFERING',
            description: '供奉莲花灯，祈福平安',
            enabled: true,
            sort: 4,
            formConfig: {
              fields: ['lampType', 'location', 'blessingName', 'phone', 'startDate']
            }
          },
          {
            name: '法会报名',
            taskType: 'RITUAL',
            description: '报名参加法会活动',
            enabled: true,
            sort: 5,
            formConfig: {
              fields: ['ritualId', 'name', 'phone']
            }
          },
          {
            name: '住宿登记',
            taskType: 'ACCOMMODATION',
            description: '登记住宿信息',
            enabled: true,
            sort: 6,
            formConfig: {
              fields: ['name', 'phone', 'roomId', 'accommodationType', 'checkInDate', 'checkOutDate']
            }
          },
          {
            name: '用餐预定',
            taskType: 'DINING',
            description: '预定斋堂用餐',
            enabled: true,
            sort: 7,
            formConfig: {
              fields: ['mealType', 'date', 'mealCount']
            }
          }
        ]
      })
      console.log('✅ 默认登记任务已初始化')
    } else {
      console.log('ℹ️  登记任务已存在')
    }

    console.log('')
    console.log('数据库初始化完成！')
  } catch (error) {
    console.error('初始化失败:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

main()
