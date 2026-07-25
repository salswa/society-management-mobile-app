import { z } from 'zod';
import { Router } from 'express';
import { asyncHandler } from '../../lib/asyncHandler';
import { validate, body } from '../../middleware/validate';
import { authenticate } from '../../middleware/authenticate';
import { emailSchema, passwordSchema, phoneSchema, uuidSchema } from '../../lib/validators';
import * as service from './auth.service';

const registerBody = z.object({
  email: emailSchema,
  password: passwordSchema,
  name: z.string().trim().min(1).max(80),
  phone: phoneSchema,
  society_id: uuidSchema,
  user_type: z.enum(['resident', 'non_resident']),
  flat_id: uuidSchema.optional(),
});

const loginBody = z.object({
  email: emailSchema,
  password: passwordSchema,
});

const refreshBody = z.object({
  refresh_token: z.string().min(1),
});

export const authRouter = Router();

authRouter.post(
  '/register',
  validate({ body: registerBody }),
  asyncHandler(async (req, res) => {
    const result = await service.register(body<typeof registerBody>(req));
    res.status(201).json(result);
  })
);

authRouter.post(
  '/login',
  validate({ body: loginBody }),
  asyncHandler(async (req, res) => {
    const result = await service.login(body<typeof loginBody>(req));
    res.json(result);
  })
);

authRouter.post(
  '/refresh',
  validate({ body: refreshBody }),
  asyncHandler(async (req, res) => {
    const session = await service.refresh(body<typeof refreshBody>(req).refresh_token);
    res.json({ session });
  })
);

authRouter.post(
  '/logout',
  authenticate,
  asyncHandler(async (req, res) => {
    await service.logout(req.auth!.token);
    res.status(204).end();
  })
);

authRouter.get(
  '/me',
  authenticate,
  asyncHandler(async (req, res) => {
    res.json({ profile: req.auth!.profile });
  })
);
