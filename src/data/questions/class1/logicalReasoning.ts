import type { TopicId } from '../../../types';
import { buildCompactQuestions } from './compactBuilder';

const groups: [TopicId, string][] = [
  [
    'odd-one-out',
    `Which one is the odd one out: Apple, Banana, Mango, Chair?|Chair|Apple|Banana|Mango|Apple, banana, and mango are fruits, while a chair is furniture.
Which one does not belong: Dog, Cat, Cow, Car?|Car|Dog|Cat|Cow|Dog, cat, and cow are animals, while a car is a vehicle.
Find the odd one out: Red, Blue, Green, Pencil.|Pencil|Red|Blue|Green|Red, blue, and green are colours; a pencil is stationery.
Which shape is different: Circle, Square, Triangle, Spoon?|Spoon|Circle|Square|Triangle|Circle, square, and triangle are shapes; a spoon is cutlery.
Find the odd one out: Bus, Train, Boat, Tomato.|Tomato|Bus|Train|Boat|Bus, train, and boat are vehicles; a tomato is a vegetable.
Which one does not belong: Eye, Ear, Nose, Book?|Book|Eye|Ear|Nose|Eye, ear, and nose are sense organs; a book is not.
Find the odd one out: Sparrow, Crow, Pigeon, Fish.|Fish|Sparrow|Crow|Pigeon|Sparrow, crow, and pigeon are birds; a fish lives in water.
Which number is the odd one out: 2, 4, 6, 7?|7|2|4|6|2, 4, and 6 are even numbers, while 7 is an odd number.
Find the odd one out: Shirt, Trousers, Hat, Banana.|Banana|Shirt|Trousers|Hat|Shirt, trousers, and hat are things we wear; a banana is a fruit.
Which one does not belong: Sunday, Monday, January, Friday?|January|Sunday|Monday|Friday|Sunday, Monday, and Friday are days; January is a month.
Find the odd one out: Milk, Water, Juice, Bread.|Bread|Milk|Water|Juice|Milk, water, and juice are drinks, while bread is solid food.
Which one is different: Sun, Moon, Star, Bicycle?|Bicycle|Sun|Moon|Star|Sun, moon, and star are in the sky; a bicycle rides on roads.
Find the odd one out: Rose, Lotus, Lily, Potato.|Potato|Rose|Lotus|Lily|Rose, lotus, and lily are flowers; a potato is a vegetable.
Which one does not belong: Pen, Eraser, Sharpener, Mango.|Mango|Pen|Eraser|Sharpener|Pen, eraser, and sharpener go in a pencil box; a mango is a fruit.
Find the odd one out: Drum, Flute, Guitar, Football.|Football|Drum|Flute|Guitar|Drum, flute, and guitar are musical instruments; a football is for sport.`,
  ],
  [
    'patterns',
    `What comes next: A, B, A, B, A, __?|B|A|C|D|The pattern alternates A and B, so B comes next.
Complete the pattern: 1, 2, 3, 1, 2, __?|3|1|4|2|The group 1, 2, 3 repeats, so 3 comes after 2.
Find the next number: 10, 20, 30, 40, __.|50|45|60|35|Each step adds 10, so 40 + 10 = 50.
What comes next: ▲, ▲, ●, ▲, ▲, __?|●|▲|■|★|Two triangles are followed by one circle, so ● comes next.
Complete the letter pattern: A, C, E, G, __.|I|H|J|F|Skipping one letter each time: A (B) C (D) E (F) G (H) I.
Find the missing number: 5, 10, __, 20, 25.|15|12|14|18|Counting by 5s gives 15 between 10 and 20.
What comes next: Sun, Moon, Sun, Moon, __?|Sun|Moon|Star|Cloud|Sun and Moon alternate, so Sun comes next.
Complete the pattern: 2, 4, 6, 8, __.|10|9|11|12|Adding 2 each time gives 8 + 2 = 10.
Find the next item: Big, Small, Big, Small, Big, __.|Small|Big|Tall|Wide|The pattern alternates Big and Small.
Complete the sequence: Z, Y, X, W, __.|V|U|T|A|Going backwards in the alphabet: Z, Y, X, W, V.
What comes next: 11, 22, 33, 44, __?|55|45|50|66|The repeating double-digit pattern continues with 55.
Find the next shape: ■, ●, ▲, ■, ●, __.|▲|■|●|★|Square, circle, triangle repeats, so ▲ is next.
Complete the countdown: 10, 9, 8, 7, __.|6|5|8|4|Counting backward by 1 gives 6.
What comes next: Clap, Snap, Clap, Snap, __?|Clap|Snap|Jump|Hop|Clap and Snap alternate, so Clap is next.
Find the missing number: 3, 6, 9, __, 15.|12|10|11|13|Adding 3 each time gives 9 + 3 = 12.`,
  ],
  [
    'analogies',
    `Hot is to Cold as Day is to __.|Night|Sun|Morning|Warm|Hot and Cold are opposites, just as Day and Night are opposites.
Bird is to Fly as Fish is to __.|Swim|Walk|Climb|Sing|Birds fly in the air; fish swim in water.
Cow is to Calf as Cat is to __.|Kitten|Puppy|Cub|Duckling|A baby cow is a calf; a baby cat is a kitten.
Brush is to Paint as Pencil is to __.|Write|Eat|Swim|Fly|We paint with a brush and write or draw with a pencil.
Eye is to See as Ear is to __.|Hear|Smell|Taste|Touch|We see with our eyes and hear with our ears.
Apple is to Fruit as Carrot is to __.|Vegetable|Flower|Tree|Drink|An apple is a fruit; a carrot is a vegetable.
Shoe is to Foot as Hat is to __.|Head|Hand|Knee|Ear|A shoe goes on your foot; a hat goes on your head.
Car is to Road as Train is to __.|Track|Sky|River|Forest|Cars drive on roads; trains run on railway tracks.
Up is to Down as Big is to __.|Small|Tall|Wide|Heavy|Up and Down are opposites, just as Big and Small are opposites.
Sun is to Day as Moon is to __.|Night|Morning|Noon|Rain|The Sun shines by day; the Moon shines by night.
Teacher is to School as Doctor is to __.|Hospital|Bakery|Zoo|Park|Teachers work in schools; doctors work in hospitals.
Mango is to Yellow as Grass is to __.|Green|Blue|Purple|Black|Ripe mangoes are yellow; healthy grass is green.
Book is to Read as Song is to __.|Sing|Cook|Kick|Build|We read a book and sing a song.
Hand is to Glove as Foot is to __.|Sock|Shirt|Cap|Belt|A glove covers a hand; a sock covers a foot.
Happy is to Smile as Sad is to __.|Cry|Laugh|Clap|Dance|When happy we smile; when sad we may cry.`,
  ],
  [
    'directions-and-order',
    `In a line of 5 children, Maya is first and Aman is right behind her. What position is Aman?|2nd|1st|3rd|5th|Right behind the 1st child is the 2nd position.
If today is Monday, what day was yesterday?|Sunday|Tuesday|Wednesday|Friday|Sunday comes one day before Monday.
If you face the rising Sun in the morning, which direction is in front of you?|East|West|North|South|The Sun rises in the East.
Which month comes right after March?|April|February|May|June|April follows March in the calendar.
Riya is taller than Sam. Sam is taller than Leo. Who is the tallest?|Riya|Sam|Leo|All equal|Riya is taller than Sam, who is taller than Leo, so Riya is tallest.
Arrange in size from smallest to largest: Ant, Cat, Elephant. Which is in the middle?|Cat|Ant|Elephant|Mouse|Ant is smallest, Elephant is biggest, so Cat is in the middle.
How many children are between the 1st child and the 4th child in a queue?|2|1|3|4|The 2nd and 3rd children stand between 1st and 4th — that is 2 children.
Which letter is the 3rd letter of the English alphabet?|C|B|D|E|A is 1st, B is 2nd, and C is 3rd.
If a clock shows 3 o'clock, where does the short hour hand point?|3|12|6|9|At 3 o'clock, the short hour hand points to 3.
Which comes first in the morning: waking up or going to sleep for the night?|Waking up|Going to sleep|Dinner|Midnight|We wake up first to start the morning.
Which is the last letter of the word TIGER?|R|T|E|G|T-I-G-E-R ends with the letter R.
Count the vowels in the word APPLE.|2|1|3|4|APPLE has two vowels: A and E.
If you turn all the way around in a full circle, where are you facing?|The same way|Backwards|Sideways|Upwards|A full circle brings you right back to where you started.
Box A holds 4 toys, Box B holds 9 toys, and Box C holds 6 toys. Which box has the fewest toys?|Box A|Box B|Box C|Box B and C|4 is smaller than 6 and 9, so Box A has the fewest.
Which day comes two days after Wednesday?|Friday|Thursday|Saturday|Tuesday|One day after Wednesday is Thursday; two days after is Friday.`,
  ],
];

export const logicalReasoningQuestions = buildCompactQuestions(
  'logical-reasoning',
  'c1-lr',
  groups,
);
