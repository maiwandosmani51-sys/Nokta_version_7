import { Router } from 'express';
import Joi from 'joi';
import { Book } from '../../models/Book';
import { authenticate, authorize } from '../../middlewares/auth';
import { validate } from '../../middlewares/validate';
import { createResponse, createError } from '../../helpers/response';
import { paginationSchema } from '../../validators/pagination';

const router = Router();
const bookSchema = Joi.object({
  body: Joi.object({
    title: Joi.string().required(),
    author: Joi.string().required(),
    isbn: Joi.string().required(),
    category: Joi.string().default('General'),
    available: Joi.boolean().default(true)
  })
});

router.use(authenticate, authorize(['super_admin', 'admin', 'librarian']));

router.post('/', validate(bookSchema), async (req, res, next) => {
  try {
    const book = await Book.create(req.body);
    res.status(201).json(createResponse(book, 'Book added'));
  } catch (error) {
    next(error);
  }
});

router.get('/', validate(paginationSchema), async (req, res, next) => {
  try {
    const page = Number(req.query.page || 1);
    const limit = Number(req.query.limit || 20);
    const search = String(req.query.search || '').trim();
    const filter: any = {};
    if (search) filter.title = { $regex: search, $options: 'i' };
    const [books, total] = await Promise.all([
      Book.find(filter).lean().skip((page - 1) * limit).limit(limit),
      Book.countDocuments(filter)
    ]);
    res.json(createResponse(books, '', { page, limit, total }));
  } catch (error) {
    next(error);
  }
});

export const bookRouter = router;
