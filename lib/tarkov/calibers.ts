const labels: Record<string, string> = {
  Caliber545x39: '5.45x39mm',
  Caliber556x45NATO: '5.56x45mm NATO',
  Caliber762x39: '7.62x39mm',
  Caliber762x51: '7.62x51mm NATO',
  Caliber762x54R: '7.62x54mmR',
  Caliber762x35: '.300 Blackout',
  Caliber68x51: '6.8x51mm',
  Caliber86x70: '.338 Lapua Magnum',
  Caliber127x99: '12.7x99mm',
  Caliber9x39: '9x39mm',
  Caliber366TKM: '.366 TKM',
  Caliber127x55: '12.7x55mm',
  Caliber9x19PARA: '9x19mm Parabellum',
  Caliber9x18PM: '9x18mm Makarov',
  Caliber9x21: '9x21mm',
  Caliber762x25TT: '7.62x25mm Tokarev',
  Caliber1143x23ACP: '.45 ACP',
  Caliber46x30: '4.6x30mm HK',
  Caliber57x28: '5.7x28mm FN',
  Caliber9x33R: '.357 Magnum',
  Caliber127x33: '.50 Action Express',
  Caliber12g: '12/70',
  Caliber20g: '20/70',
  Caliber23x75: '23x75mm',
  Caliber40x46: '40x46mm',
  Caliber40mmRU: '40mm VOG-25',
  Caliber26x75: '26x75mm flare',
};

export function caliberLabel(caliber: string): string {
  return labels[caliber] ?? caliber.replace(/^Caliber/, '');
}
