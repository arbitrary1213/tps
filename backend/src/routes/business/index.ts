import { Router } from 'express'
import logisticsRoutes from './logistics'
import plaquesPrintingRoutes from './plaquesPrinting'
import peopleRoutes from './people'
import ritualsRoutes from './rituals'
import systemAdminRoutes from './systemAdmin'

const router = Router()

router.use(peopleRoutes)
router.use(ritualsRoutes)
router.use(logisticsRoutes)
router.use(systemAdminRoutes)
router.use(plaquesPrintingRoutes)

export default router
