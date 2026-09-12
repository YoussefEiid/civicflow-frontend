export const IRAQI_GOVERNORATES = [
  'دهوك',
  'نينوى',
  'أربيل',
  'كركوك',
  'السليمانية',
  'صلاح الدين',
  'الأنبار',
  'ديالى',
  'بغداد',
  'واسط',
  'بابل',
  'كربلاء',
  'النجف',
  'القادسية',
  'ميسان',
  'ذي قار',
  'المثنى',
  'البصرة',
  'حلبجة'
] as const;

export type IraqiGovernorate = typeof IRAQI_GOVERNORATES[number];
