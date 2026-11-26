import type { TopicId } from '../../../types';
import { buildCompactQuestions } from './compactBuilder';

const groups: [TopicId, string][] = [
  [
    'india-and-festivals',
    `Which is the national bird of India?|Peacock|Sparrow|Crow|Eagle|The colourful peacock is India's national bird.
Which is the national animal of India?|Tiger|Lion|Elephant|Deer|The Bengal tiger is India's national animal.
Which is the national flower of India?|Lotus|Rose|Sunflower|Jasmine|The lotus is the national flower of India.
How many colours are in the Indian national flag (excluding the wheel)?|Three|Two|Four|Five|The Tricolour has saffron, white, and green.
What is the capital city of India?|New Delhi|Mumbai|Kolkata|Bengaluru|New Delhi is the capital of India.
Which festival is known as the Festival of Lights?|Diwali|Holi|Pongal|Onam|Diwali is celebrated with diyas and lights.
Which festival is famous for playing with natural colours?|Holi|Diwali|Eid|Christmas|Holi is the joyful festival of colours.
What colour is at the top of the Indian national flag?|Saffron|Green|White|Blue|Saffron is the top band of the Tricolour.
Which monument in Agra is built of white marble?|Taj Mahal|Red Fort|India Gate|Qutub Minar|The Taj Mahal in Agra is famous for its white marble.
Which fruit is called the King of Fruits in India?|Mango|Apple|Banana|Grapes|Mango is lovingly called the King of Fruits.
Which river is considered sacred in India?|Ganga|Thames|Nile|Amazon|The Ganga is one of India's great sacred rivers.
Which festival celebrates the bond between brothers and sisters?|Raksha Bandhan|Lohri|Bihu|Baisakhi|Sisters tie a rakhi on their brothers' wrists on Raksha Bandhan.`,
  ],
  [
    'space-and-seasons',
    `Which planet do we live on?|Earth|Mars|Jupiter|Venus|Planet Earth is our home.|earth
What gives Earth light and warmth during the day?|Sun|Moon|Stars|Clouds|The Sun lights up and warms the Earth by day.|sun
What shines in the night sky and changes shape through the month?|Moon|Sun|Rainbow|Rainbow cloud|The Moon appears to change shape from crescent to full moon.
How many colours are in a rainbow?|7|5|6|8|A rainbow has 7 bands of colour (VIBGYOR).
Which season has heavy rain and dark clouds?|Monsoon|Winter|Summer|Autumn|Monsoon is the rainy season.
In which season do we wear woollen sweaters and caps?|Winter|Summer|Monsoon|Spring|Winter is cold, so we wear warm woollens.
What do plants and flowers do in Spring?|Bloom|Freeze|Dry up|Fall asleep|Spring is mild and flowers bloom everywhere.
In which direction does the Sun rise?|East|West|North|South|The Sun always rises in the East.
In which direction does the Sun set?|West|East|North|South|The Sun sets in the West every evening.
Which is the closest star to Earth?|The Sun|Polaris|Sirius|Mars|The Sun is actually a bright star closest to Earth.|sun
What falls from clouds when the air is freezing cold?|Snow|Sand|Leaves|Coins|Frozen water droplets fall as soft white snow.
Which planet is famous for its bright rings?|Saturn|Earth|Mars|Mercury|Saturn has large icy rings around it.|saturn`,
  ],
  [
    'community',
    `Who helps put out fires and rescue people?|Firefighter|Baker|Tailor|Painter|Firefighters use fire engines and hoses to put out fires.
Who stitches our clothes?|Tailor|Cobbler|Chef|Pilot|A tailor stitches shirts, dresses, and uniforms.
Who mends our shoes?|Cobbler|Barber|Dentist|Postman|A cobbler repairs shoes and sandals.
Who checks and takes care of our teeth?|Dentist|Pilot|Farmer|Carpenter|A dentist keeps our teeth healthy and clean.
Who flies an aeroplane?|Pilot|Driver|Sailor|Chef|A pilot flies aeroplanes safely in the sky.
Who grows grains, fruits, and vegetables on a farm?|Farmer|Plumber|Librarian|Painter|Farmers grow the food we eat.
Where do we go to borrow storybooks?|Library|Hospital|Bank|Station|A library is full of books we can read and borrow.
Who delivers letters and parcels to our homes?|Postman|Doctor|Mason|Florist|A postman brings letters and parcels.
Which vehicle runs on iron tracks?|Train|Bus|Boat|Bicycle|Trains travel along steel railway tracks.
Which vehicle sails on water?|Ship|Truck|Scooter|Auto|Ships and boats travel across water.
Who makes wooden tables and chairs?|Carpenter|Plumber|Chef|Barber|A carpenter builds furniture out of wood.
What colour traffic light tells vehicles to STOP?|Red|Green|Yellow|Blue|Red means stop, yellow means wait, and green means go.`,
  ],
  [
    'world',
    `How many legs does a spider have?|8|6|4|10|Spiders have 8 legs, while insects have 6.
Which animal is called the Ship of the Desert?|Camel|Horse|Elephant|Zebra|Camels can travel across hot sandy deserts easily.
Which is the largest land animal on Earth?|Elephant|Lion|Giraffe|Bear|The elephant is the biggest animal living on land.
Which animal has a very long neck to reach tall tree leaves?|Giraffe|Tiger|Kangaroo|Penguin|Giraffes use their long necks to eat high leaves.
Which sport uses a bat, ball, and wickets?|Cricket|Football|Swimming|Chess|Cricket is played with a bat, ball, and wickets.
Which musical instrument has black and white keys?|Piano|Drum|Flute|Guitar|A piano is played by pressing black and white keys.
Which sweet food is made by honeybees?|Honey|Butter|Jam|Cheese|Honeybees collect nectar to make honey.
Which bird is famous for imitating human speech?|Parrot|Owl|Duck|Swan|Parrots can copy words and sounds.
Which continent is India located in?|Asia|Africa|Europe|Australia|India is in South Asia.
How many players are in a standard chess game?|2|4|6|11|Chess is a strategy board game for 2 players.
Which animal carries its baby in a pouch?|Kangaroo|Monkey|Deer|Wolf|Mother kangaroos carry their joeys in a pouch.
What do caterpillars turn into?|Butterflies|Bees|Frogs|Snails|A caterpillar grows inside a chrysalis and becomes a butterfly.`,
  ],
];

export const gkExtraQuestions = buildCompactQuestions('general-knowledge', 'c1-gk-ex', groups);
