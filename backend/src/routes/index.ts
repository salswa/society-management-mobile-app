import { Router } from 'express';
import { authRouter } from '../modules/auth/auth.controller';
import { profileRouter } from '../modules/profile/profile.controller';
import { societyRouter } from '../modules/society/society.controller';
import { towersRouter } from '../modules/towers/towers.controller';
import { flatsRouter } from '../modules/flats/flats.controller';
import { residentsRouter } from '../modules/residents/residents.controller';
import { visitorsRouter } from '../modules/visitors/visitors.controller';
import { complaintsRouter } from '../modules/complaints/complaints.controller';
import { amenitiesRouter, bookingsRouter } from '../modules/amenities/amenities.controller';
import { noticesRouter } from '../modules/notices/notices.controller';
import { pollsRouter } from '../modules/polls/polls.controller';
import { staffRouter } from '../modules/staff/staff.controller';
import { maintenanceRouter } from '../modules/maintenance/maintenance.controller';
import { publicRouter } from '../modules/public/public.controller';

export const apiRouter = Router();

apiRouter.get('/health', (_req, res) => res.json({ status: 'ok' }));

apiRouter.use('/public', publicRouter);
apiRouter.use('/auth', authRouter);
apiRouter.use('/profile', profileRouter);
apiRouter.use('/society', societyRouter);
apiRouter.use('/towers', towersRouter);
apiRouter.use('/flats', flatsRouter);
apiRouter.use('/residents', residentsRouter);
apiRouter.use('/visitors', visitorsRouter);
apiRouter.use('/complaints', complaintsRouter);
apiRouter.use('/amenities', amenitiesRouter);
apiRouter.use('/bookings', bookingsRouter);
apiRouter.use('/notices', noticesRouter);
apiRouter.use('/polls', pollsRouter);
apiRouter.use('/staff', staffRouter);
apiRouter.use('/maintenance', maintenanceRouter);
