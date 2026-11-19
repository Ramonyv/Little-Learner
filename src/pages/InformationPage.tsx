import { Link, useParams } from 'react-router-dom';

export const informationPages: Record<string, {title: string; description: string; sections: [string,string][]}> = {
  faq: {
    title: 'Frequently Asked Questions',
    description: 'Answers about tracing worksheets, drawing on iPad, saved work, and Class 1 practice in Little Learner.',
    sections: [
      ['What is the difference between Trace and Worksheet?', 'Trace shows one large guide at a time. Worksheet repeats the selected item across six rows, with a solid example at the start of each row and dotted copies after it. Choose Letters, Numbers, Words, Shapes, Pictures, or Lines & curves, then use Next to move through that category.'],
      ['Can I make a number or word bigger?', 'In Trace, select Letters, Numbers, or Words and move the size slider. At 100%, the guide scales to fit the available drawing area with padding. Long words fit to the width, so their letters appear smaller than a single letter or number. The slider does not change Worksheet’s repeated rows.'],
      ['Does my child need an Apple Pencil?', 'No. The drawing board accepts finger, mouse, and stylus input. A pressure-capable stylus can vary the width of tools such as Pen and Ink. Finger and mouse drawing use a steady pressure value. Brush size can be changed with the five stroke-size buttons.'],
      ['How do I find the colors and brush sizes on iPad?', 'The bottom toolbar scrolls sideways. Swipe across the tool tray or use its left and right arrow buttons to reveal controls. On small phone screens, open the tools button below the drawing area to show the controls.'],
      ['Which brush should my child start with?', 'Try Monoline for a steady outline or Marker for a solid, broader line. Crayon and Chalk add grain. Watercolor makes soft translucent washes that become darker when painted over. Rainbow changes color as the stroke travels. Choosing a preset color does not override Rainbow’s changing colors.'],
      ['Why does Watercolor look different when strokes overlap?', 'Watercolor uses translucent pigment, so repeated passes build color. The app simulates soft edges and pigment texture. A short test stroke on an empty area helps you choose a suitable size before coloring a larger drawing.'],
      ['What does Fill do on the Gods page?', 'Select Fill, choose a color, and tap an area. On the Ganesha, Krishna, Shiva, and Hanuman SVG pages, Fill colors the visible connected area bounded by the outline. Other deity pages use their individual shape regions. A brush draws freely over the page. Eraser removes drawn strokes, while Undo can reverse a fill action.'],
      ['Will a drawing still be there after I refresh?', 'Completed strokes, coloring choices, and completed quiz results are saved in this browser. Open My Work to continue a drawing or export a backup. Browser storage is limited and can be cleared or evicted, so download important work. Active quiz sessions are held in memory.'],
      ['Can I save a worksheet or colored deity?', 'Yes. Open Download inside the drawing area and select Save JPG or Save PDF. The export includes the board background, visible guide or deity artwork, and drawn strokes. Menus and action buttons are excluded. PDF contains a rendered image of the artwork. Your browser handles where the downloaded file is saved.'],
      ['Why can’t I erase a dotted guide or the deity outline?', 'Eraser operates on the drawing layer. The guide and original illustration sit underneath it so they remain available for practice. Clear removes the current activity’s drawing and coloring work. Use Undo immediately if you cleared something you wanted to keep.'],
      ['Can I return to a word without losing the previous word’s drawing?', 'During the current visit, each Trace and Worksheet item has its own drawing. Use Next to move through the category. After the last item, Next continues to the next category. Returning to an item restores its locally saved drawing.'],
      ['Are the quiz results official Olympiad scores?', 'No. They describe practice completed in Little Learner. Use answer review to discuss mistakes and explanations with your child. Little Learner is an independent resource and does not claim endorsement by CBSE or an Olympiad organizer. Completed practice results are saved in this browser.'],
      ['How do I report an incorrect answer or a drawing problem?', 'Open Contact and include the subject, topic, and question text for an answer problem. For drawing issues, include the device, browser, brush, and what happened. Reports should come from an adult. Email ramandesigns9@gmail.com and avoid including a child’s personal details.']
    ]
  },
  privacy: {
    title: 'Privacy Policy',
    description: 'How Little Learner handles browser storage, drawings, and information about visitors.',
    sections: [
      ['Who this service is for', 'Little Learner offers learning activities for young children with parent or teacher supervision. Children can use the activities without registering an account or providing their name, email, or date of birth.'],
      ['Drawings and practice results', 'Drawing strokes, coloring choices, selected class, and quiz sessions are held in browser memory during use. Completed drawings, coloring pages, and completed results are also saved in local browser storage. The app does not upload these to a drawing or results server. Active quiz work can be cleared by refreshing. Saved work can be removed through My Work or browser site-data controls. Downloaded JPG and PDF files are saved through your browser and remain under your control.'],
      ['Browser storage', 'The tracing size preference is saved in local storage on your device. You can remove it using your browser’s site-data controls. Clearing site data may reset preferences.'],
      ['Hosting and external resources', 'The site is hosted on Netlify. Requests to the host may include your IP address, browser information, requested address, and technical logs. Fonts are loaded from Google Fonts and some interface icons use Iconify resources. These providers receive connection information when your browser requests their resources. Their own privacy policies explain their processing.'],
      ['Advertising and analytics', 'This version does not include Google AdSense advertising code or a dedicated analytics tracker. If advertising is introduced, this policy will be updated with the providers, data uses, and available controls before that processing begins.'],
      ['Children and privacy requests', 'Parents and guardians should supervise use and avoid putting personal information into drawings. For privacy questions, email ramandesigns9@gmail.com. The creator’s website is https://ramanyv.work. When contacting the operator, provide only the information needed to explain your request.'],
      ['Contact messages', 'If you email us, your email address and message are processed through our email provider to respond to your request. Messages may remain in correspondence history. You can email the same address to request deletion of correspondence, subject to any applicable retention obligations.'],
      ['Changes', 'This policy describes the current version of the service. Material changes to data handling will be reflected here. Last updated 19 November 2026.']
    ]
  },
  terms: {
    title: 'Terms of Use', description: 'Guidelines for using Little Learner’s practice activities and drawing tools.',
    sections: [
      ['Learning with Little Learner', 'Use the activities for personal learning or supervised classroom practice. Parents and teachers should choose suitable activities and help children understand feedback.'],
      ['Educational purpose', 'Practice questions and tracing activities supplement learning. They do not replace school instruction, and results do not constitute official exam scores or a guarantee of admission, rank, or academic achievement.'],
      ['Availability and saving work', 'Features may change and the service may occasionally be unavailable. Save important drawings with Download. Work and practice history may be lost when you refresh, close, or leave the app.'],
      ['Respectful use', 'Do not attempt to disrupt the service, bypass security, or submit unlawful or harmful material. Avoid including personal information about children in drawings or messages.'],
      ['Content and corrections', 'Site illustrations, interface assets, and learning material may be subject to copyright. Access does not grant permission to redistribute the whole question bank or branding. You retain any rights you have in your original drawings. Report suspected errors or rights concerns through Contact.'],
      ['Independent resource', 'Little Learner is an independent learning resource. References to CBSE, class levels, and Olympiad practice describe the intended learning context and do not imply endorsement by an examination board.']
    ]
  },
  'parent-guide': {
    title: 'A Parent’s Guide to Little Learner', description: 'Plan short, supported practice sessions for reading, tracing, and creative drawing.',
    sections: [
      ['Start with a short session', 'Choose one activity and let your child work at a comfortable pace. Five to ten minutes can be enough for an introduction. Stop for a break when your child becomes tired or frustrated.'],
      ['Practice questions together', 'Open Practice, choose a subject and a topic or practice paper, and read the instructions together. Ask your child to explain a choice before checking the answer. Use an incorrect answer to discuss the idea and try a related example.'],
      ['Build control before speed', 'On the Drawing Board, begin with Lines & curves or Shapes. Move to Letters, Numbers, and Words when your child is comfortable following a guide. Adjust the tracing size so the movement feels manageable.'],
      ['Use a worksheet', 'Worksheet repeats the selected guide across rows. The first example is solid, followed by dotted copies. Encourage slow tracing and relaxed hand movement. Use Next to change the item.'],
      ['Explore creative tools', 'Free Draw provides a blank board. Try a steady Monoline for outlines, textured Crayon for coloring, Watercolor for translucent washes, or Rainbow for changing colors. Finger drawing and a stylus can feel different, so begin with a medium brush size.'],
      ['Save and review', 'Use Download to save a JPG or PDF. Talk about one thing your child enjoyed and one thing to try next time. Completed practice results are stored on this browser. Use My Work to back them up.']
    ]
  },
  disclaimer: {
    title: 'Educational Disclaimer', description: 'Understand the scope of Little Learner’s learning content.',
    sections: [
      ['Supplementary practice', 'Little Learner provides general learning and creative activities for children. Content is intended for practice with adult support. It is not an official curriculum, assessment, or certification service.'],
      ['Accuracy and feedback', 'Questions and explanations can contain mistakes. Parents and teachers should use their judgment and report suspected errors through Contact, including the subject, topic, and question text.'],
      ['Names and affiliation', 'CBSE and other educational names belong to their respective owners. Little Learner does not claim affiliation with or approval from these organizations.']
    ]
  }
};

export function InformationPage() {
  const { slug = '' } = useParams();
  const page = informationPages[slug];
  if (!page) return <div className="max-w-3xl mx-auto p-6"><h1 className="text-3xl font-black">Page not found</h1><Link to="/">Return home</Link></div>;
  return <article className="max-w-3xl mx-auto px-5 py-10">
    <h1 className="text-3xl sm:text-4xl font-black mb-4">{page.title}</h1>
    <p className="text-lg text-slate-600 mb-8">{page.description}</p>
    {page.sections.map(([title, body]) => <section key={title} className="mb-7"><h2 className="text-xl font-extrabold mb-2">{title}</h2><p className="text-slate-600 leading-relaxed">{body}</p></section>)}
    <Link className="text-brand-blue font-bold underline" to="/contact">Contact Little Learner</Link>
  </article>;
}
