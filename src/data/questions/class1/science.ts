import { Question, TopicId } from '../../../types';

// Each line is a question followed by its answer and three plausible choices.
const groups: [TopicId, string][] = [
  ['living-things', `Which of these is a living thing?|Butterfly|Chair|Stone|Spoon
Which of these needs food to grow?|Puppy|Table|Ball|Book
Which of these can grow on its own?|Tree|Toy car|Cup|Pencil
Which of these is made by people?|Plastic bottle|Tree|Ant|Flower
What do all living things need?|Water|Television|Shoes|Paint
Which of these can breathe?|Fish|Rock|Desk|Clock
Which of these is a baby animal?|Kitten|Seed|Pebble|Leaf
Which living thing grows from a seed?|Plant|Cat|Bird|Ant
Which of these is not living?|Kite|Crow|Grass|Mango tree
What happens to a young plant as it grows?|It gets bigger|It becomes a stone|It becomes a toy|It stops needing water`],
  ['plants', `Which part of a plant takes in water from soil?|Roots|Flowers|Fruits|Leaves
Which part of a plant makes food using sunlight?|Leaves|Roots|Flowers|Seeds
Which part of a plant usually holds it upright?|Stem|Fruit|Petal|Seed
What can grow into a new plant?|Seed|Stone|Spoon|Shell
Which part of a plant can become a fruit?|Flower|Root|Stem|Branch
Which of these is a tree?|Mango|Mint|Grass|Rose bush
Which of these is a herb?|Mint|Mango tree|Coconut tree|Banyan tree
Which of these is a creeper?|Pumpkin plant|Mango tree|Rose bush|Sunflower
What does a plant need to grow well?|Sunlight and water|Only toys|Only paint|Only sand
Which plant part do we eat in a carrot?|Root|Flower|Seed|Leaf`],
  ['animals', `Which animal gives us milk?|Cow|Hen|Bee|Silkworm
Which animal lays eggs?|Hen|Cat|Cow|Dog
What is a baby dog called?|Puppy|Kitten|Calf|Chick
What is a baby cow called?|Calf|Puppy|Lamb|Cub
Which animal lives in water?|Fish|Camel|Cow|Monkey
Which bird cannot fly?|Ostrich|Sparrow|Crow|Pigeon
Which animal has a long trunk?|Elephant|Tiger|Deer|Goat
Which animal is known for its hump?|Camel|Horse|Dog|Rabbit
Which animal makes honey?|Honeybee|Butterfly|Ant|Housefly
Which animal is a wild animal?|Lion|Goat|Cow|Dog`],
  ['animals', `Where does a bird usually live?|Nest|Kennel|Stable|Shed
Where does a dog usually live?|Kennel|Nest|Hive|Pond
Where do bees live?|Hive|Kennel|Stable|Nest
Which animal eats grass?|Cow|Tiger|Lion|Eagle
Which animal eats meat?|Tiger|Goat|Cow|Deer
What helps a bird fly?|Wings|Fins|Hooves|Paws
What helps a fish swim?|Fins|Wings|Hooves|Claws
Which animal has a shell on its back?|Tortoise|Rabbit|Cow|Horse
Which bird has a curved beak?|Parrot|Duck|Hen|Sparrow
Which animal changes from a caterpillar?|Butterfly|Frog|Fish|Cow`],
  ['our-body', `Which body part helps us see?|Eyes|Ears|Nose|Tongue
Which body part helps us hear?|Ears|Eyes|Hands|Feet
Which body part helps us smell?|Nose|Tongue|Eyes|Ears
Which body part helps us taste?|Tongue|Nose|Skin|Hair
Which body part helps us feel touch?|Skin|Hair|Nails|Teeth
How many eyes do most people have?|Two|One|Three|Four
Which part helps us chew food?|Teeth|Toes|Ears|Elbows
Which part helps us walk?|Legs|Ears|Nose|Hair
Which part helps us hold a pencil?|Fingers|Toes|Ears|Knees
Which organ pumps blood around our body?|Heart|Stomach|Tongue|Nose`],
  ['health-and-hygiene', `When should we wash our hands?|Before eating|Only on Sundays|Only at night|Never
What should we use to clean our teeth?|Toothbrush|Comb|Towel|Spoon
How often should we brush our teeth?|Twice a day|Once a week|Once a month|Never
What should we do before eating a fruit?|Wash it|Paint it|Hide it|Drop it
Which food helps us stay healthy?|Fresh fruit|Only sweets|Only chips|Only fizzy drinks
Why do we need sleep?|To rest and grow|To avoid drinking water|To make teeth blue|To stop breathing
What should cover our mouth when we cough?|Elbow or tissue|Dirty hands|Food|A toy
What should we drink regularly?|Clean water|Dirty water|Paint|Oil
What should we do after using the toilet?|Wash hands with soap|Eat sweets|Touch our eyes|Skip handwashing
Which habit keeps our body clean?|Bathing regularly|Wearing dirty clothes|Avoiding soap|Never washing`],
  ['earth-and-sky', `Which is a source of natural light?|Sun|Moon|Mirror|Book
What do we see in the sky during the day?|Sun|Stars only|Streetlights|Fireflies
What does the Moon get its light from?|Sun|Earth|Clouds|Rain
What makes a shadow?|An object blocking light|A sound|A smell|Wind alone
Which season is usually the hottest?|Summer|Winter|Rainy season|Spring
What do we use in the rain?|Umbrella|Sunglasses|Woollen cap|Fan
Which clothes keep us warm in winter?|Woollen clothes|Thin cotton clothes|Raincoat|Swimsuit
Which direction does the Sun rise from?|East|West|North|South
Which of these falls from clouds?|Rain|Sand|Leaves|Stones
Which object shines at night in the sky?|Moon|Sunflower|Mountain|Rainbow`],
  ['air-and-water', `What do we breathe in to live?|Air|Smoke|Sand|Paint
Which of these shows that air is present?|A moving flag|A still stone|A closed book|A dry cup
What do plants need from air?|Carbon dioxide|Plastic|Dust|Smoke
What do people and animals need from air?|Oxygen|Smoke|Dust|Paint
What happens to wet clothes in sunshine?|They dry|They turn to stone|They grow roots|They become ice
Which of these is clean drinking water?|Filtered water|Muddy pond water|Soapy water|Sea water
Where does rainwater collect naturally?|Ponds and rivers|Only cupboards|Only books|Only shoes
What should we do with a dripping tap?|Turn it off|Leave it running|Break it|Ignore it
What is ice made from?|Water|Sand|Air|Oil
What happens to ice when it gets warm?|It melts into water|It becomes a plant|It turns into wood|It disappears forever`],
  ['materials-and-safety', `Which of these is a natural material?|Wood|Plastic|Nylon|Glass
Which object is made of glass?|Window pane|Woollen sweater|Wooden chair|Paper bag
Which material soaks up water easily?|Cotton|Plastic|Metal|Glass
Which object is attracted by a magnet?|Iron nail|Wooden pencil|Plastic cup|Rubber band
Which of these is a source of sound?|Ringing bell|Still stone|Closed book|Empty page
Which sense helps us hear a bell?|Hearing|Smell|Taste|Sight
Which of these can float on water?|Dry leaf|Iron nail|Stone|Coin
Which of these usually sinks in water?|Stone|Dry leaf|Empty plastic bottle|Cork
What should we do with paper waste?|Put it in a bin|Throw it on the road|Drop it in a river|Leave it in a park
Which of these is a safe way to cross a road?|Use a zebra crossing with an adult|Run without looking|Play on the road|Cross between moving cars`],
  ['materials-and-safety', `What colour is a healthy leaf usually?|Green|Black|Purple|White
Which plant gives us cotton?|Cotton plant|Rose plant|Mango tree|Cactus
Which animal gives us wool?|Sheep|Fish|Hen|Bee
Which of these is a fruit?|Apple|Potato|Carrot|Spinach
Which of these is a vegetable?|Carrot|Mango|Banana|Grapes
Which meal is usually eaten in the morning?|Breakfast|Dinner|Supper|Midnight snack
Why should we eat different kinds of food?|To get different nutrients|To avoid water|To stop growing|To make food dirty
What should we do when a traffic light is red?|Stop|Run|Jump|Speed up
Which part of the body should a helmet protect?|Head|Feet|Hands|Knees
Who should we tell if we find a sharp broken glass piece?|A trusted adult|A pet|Nobody|A toy`],
];

export const scienceQuestions: Question[] = groups.flatMap(([topicId, lines], groupIndex) =>
  lines.split('\n').map((line, lineIndex) => {
    const [question, answer, ...incorrect] = line.split('|');
    const correctAnswer = ((groupIndex * 10 + lineIndex) % 4) as 0 | 1 | 2 | 3;
    const options = [...incorrect];
    options.splice(correctAnswer, 0, answer);
    return {
      id: `science-${groupIndex * 10 + lineIndex + 1}`,
      classNumber: 1,
      subjectId: 'science',
      topicId,
      difficulty: groupIndex < 6 ? 'easy' : 'medium',
      question,
      options: options as [string, string, string, string],
      correctAnswer,
      explanation: `The correct answer is ${answer}.`,
    };
  })
);
