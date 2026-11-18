export interface Guide { title: string; path?: string; text?: string; start?: [number, number] }
const path = (title: string, path: string, x: number, y: number): Guide => ({ title, path, start: [x,y] })
const letters = (chars: string): Guide[] => [...chars].map(text => ({ title: 'Trace ' + text, text }))
export const guides: Record<string, Guide[]> = {
  'Lines & curves': [
    path('Trace the wave', 'M60 170 Q145 285 230 170 T400 170 T570 170 T740 170',60,170),
    path('Trace the straight line','M75 170 H725',75,170),
    path('Trace the zigzag','M75 230 L180 95 L285 230 L390 95 L495 230 L600 95 L705 230',75,230),
    path('Trace the loops','M65 220 C155 220 220 60 155 85 S100 235 220 220 S375 55 305 85 S250 235 375 220 S530 55 460 85 S405 235 540 220 Q620 210 725 145',65,220)
  ],
  Shapes: [
    path('Trace the circle','M400 52 A118 118 0 1 1 399.9 52 Z',400,52),
    path('Trace the square','M284 54 H516 V286 H284 Z',284,54),
    path('Trace the triangle','M400 50 L545 282 H255 Z',400,50),
    path('Trace the star','M400 40 L438 130 L536 139 L462 203 L485 298 L400 247 L315 298 L338 203 L264 139 L362 130 Z',400,40)
  ],
  Letters: letters('ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz'),
  Numbers: letters('0123456789'),
  Words: ['cat','sun','kite','hello','rainbow'].map(text => ({ title: 'Trace the word', text })),
  Pictures: [
    path('Trace the mountain','M140 265 L325 65 L415 165 L498 98 L660 265 Z M270 125 L310 145 L325 122 L348 140 L373 118',140,265),
    path('Trace the house','M230 155 L400 40 L570 155 H530 V293 H270 V155 Z M365 293 V207 H435 V293',230,155),
    path('Trace the butterfly','M400 170 C260 -35 125 130 323 191 C178 290 347 340 400 190 C453 340 622 290 477 191 C675 130 540 -35 400 170 Z M400 150 V218',400,170)
  ]
}
