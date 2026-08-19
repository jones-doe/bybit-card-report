/**
 * Categories are coloured from a fixed 7-slot categorical palette assigned once
 * across the whole history — a category keeps its colour in every month, so the
 * colour follows the category and never its rank inside one month. Everything
 * past the top 7 folds into a neutral "Прочее" bucket rather than getting a
 * generated hue.
 */
export const CATEGORY_SLOTS = 7

export const OTHER_CATEGORY = 'Прочее'

/** Label for records the API left without a category. */
export const NO_CATEGORY = 'Без категории'
