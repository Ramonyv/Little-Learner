import type { TopicId } from '../../../types';
import { buildCompactQuestions } from './compactBuilder';

const groups: [TopicId, string][] = [
  [
    'numbers',
    `Which number comes right after 49?|50|48|51|40|Counting up one from 49 gives 50.
What is the number name for 17?|Seventeen|Seventy|Seven|Sixteen|17 is written as seventeen.
Which is the greatest number among 34, 43, 29, and 19?|43|34|29|19|43 has 4 tens, which is more than 3, 2, or 1 ten.
Which is the smallest two-digit number?|10|11|99|1|10 is the first and smallest two-digit number.
How many tens are in the number 60?|6|60|0|10|60 equals 6 groups of ten.
What number has 3 tens and 8 ones?|38|83|30|11|3 tens (30) plus 8 ones equals 38.
Which number comes between 78 and 80?|79|77|81|70|79 sits right between 78 and 80.
Which number is an even number?|14|13|17|9|Even numbers end in 0, 2, 4, 6, or 8, so 14 is even.
Which number is an odd number?|25|22|24|28|Odd numbers end in 1, 3, 5, 7, or 9, so 25 is odd.
Count by 2s: 2, 4, 6, __, 10.|8|7|9|12|Adding 2 to 6 gives 8.
Count by 5s: 5, 10, 15, __, 25.|20|16|18|30|Adding 5 to 15 gives 20.
Which symbol makes 19 __ 24 true?|<|>|=|+|19 is less than 24, so we use <.`,
  ],
  [
    'addition-subtraction',
    `What is 9 + 6?|15|14|16|13|Start at 9 and count 6 steps forward to reach 15.|beads-9-6
What is 14 - 5?|9|8|10|7|Taking 5 away from 14 leaves 9.
Rohan has 12 marbles. He gives 4 to Tia. How many are left?|8|16|9|7|12 minus 4 equals 8 marbles left.
What is 20 + 30?|50|40|60|10|2 tens plus 3 tens equals 5 tens, or 50.
Which pair adds up to 10?|7 and 3|6 and 5|8 and 3|4 and 5|7 + 3 = 10.
What is 18 - 0?|18|0|1|17|Subtracting zero leaves the number unchanged at 18.
A basket has 8 red apples and 7 green apples. Total apples?|15|14|16|13|8 + 7 = 15 apples in total.
What number should go in the box: 5 + [ ] = 13?|8|7|9|6|5 plus 8 equals 13.
What is 25 - 5?|20|30|15|21|Taking away 5 ones from 25 leaves 20.
Diya read 6 pages yesterday and 9 pages today. How many pages in all?|15|14|16|12|6 + 9 = 15 pages read in all.
What is 11 + 11?|22|21|20|23|11 plus 11 equals 22.
If 10 birds sit on a tree and 4 fly away, how many stay?|6|14|5|7|10 minus 4 leaves 6 birds.`,
  ],
  [
    'shapes',
    `How many sides does a square have?|4|3|5|6|A square has 4 equal straight sides.|square
Which shape is completely round with no corners?|Circle|Triangle|Square|Rectangle|A circle is round and has 0 corners.|circle
Which 3D shape looks like a cricket ball?|Sphere|Cube|Cone|Cylinder|A ball is shaped like a sphere.|sphere
Which 3D shape looks like an ice-cream cone?|Cone|Cube|Sphere|Cuboid|An ice-cream cone has a pointed tip and round base.|cone
Which 3D shape looks like a dice?|Cube|Sphere|Cone|Cylinder|A dice has 6 square faces, making it a cube.|cube
What comes next in the pattern: ★, ●, ★, ●, ★, __?|●|★|▲|■|The pattern alternates star then circle, so circle comes next.
How many corners does a rectangle have?|4|2|3|6|A rectangle has 4 square corners.|rectangle
Which shape looks like a birthday cap?|Cone|Cube|Cylinder|Sphere|A party hat narrows to a point like a cone.|cone`,
  ],
  [
    'time-and-money',
    `How many days are there in one week?|7|5|6|10|There are 7 days in a week.
Which day comes right after Friday?|Saturday|Thursday|Sunday|Monday|Saturday follows Friday.
How many months are in a year?|12|10|7|24|A year has 12 months from January to December.
When the minute hand is on 12 and hour hand is on 4, what time is it?|4 o'clock|12 o'clock|6 o'clock|8 o'clock|With the minute hand at 12, the hour hand points to 4 o'clock.|clock-4
Which Indian coin has the highest value among ₹1, ₹2, ₹5, and ₹10?|₹10|₹5|₹2|₹1|₹10 is worth more than ₹1, ₹2, and ₹5.
If a pencil costs ₹5 and an eraser costs ₹3, what is the total cost?|₹8|₹7|₹9|₹2|₹5 + ₹3 = ₹8.
Which meal do we eat in the morning?|Breakfast|Dinner|Supper|Midnight snack|Breakfast is the first meal of the morning.
You have one ₹10 note and buy a sticker for ₹6. How much change is left?|₹4|₹6|₹5|₹3|₹10 minus ₹6 leaves ₹4 change.`,
  ],
  [
    'measurement',
    `Which is heavier: an elephant or a sparrow?|Elephant|Sparrow|Both are equal|Feather|An elephant weighs much more than a sparrow.
Which object is the longest: a pencil, a bus, or a spoon?|Bus|Pencil|Spoon|Eraser|A bus is much longer than a pencil or spoon.
Which container holds the most water?|Bucket|Cup|Spoon|Bottle cap|A bucket has the largest capacity.
How many hands does a standard clock have to show hours and minutes?|2|1|4|5|A clock uses a short hour hand and a long minute hand.
Which is shorter than a school ruler?|Paperclip|Door|Bed|Bicycle|A paperclip is tiny and shorter than a ruler.
Which season brings the hottest days of the year?|Summer|Winter|Monsoon|Spring|Summer has the warmest and sunniest days.
If a ribbon is 8 cubes long and another is 5 cubes long, which is longer?|The 8-cube ribbon|The 5-cube ribbon|Both are same|Cannot tell|8 cubes is longer than 5 cubes.
Which tool tells us how heavy apples are?|Weighing balance|Clock|Ruler|Thermometer|A weighing balance measures weight.`,
  ],
];

export const mathExtraQuestions = buildCompactQuestions('mathematics', 'c1-math-ex', groups);
