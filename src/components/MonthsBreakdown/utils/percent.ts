export const percent = (share: number) => `${share >= 0.01 ? Math.round(share * 100) : '<1'}%`
