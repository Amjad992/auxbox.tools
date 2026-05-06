import PropTypes from 'prop-types';

export const metadata = {
  title: 'Bill Splitter — Split a Restaurant Bill by Item',
  description:
    'Free bill splitter for groups. Add who ordered what, set tax and tip, and see exactly what each person owes. Mobile-friendly, no upload, runs entirely in your browser.',
  keywords: [
    'Bill Splitter',
    'Split the Check',
    'Who Owes What Calculator',
    'Restaurant Bill Split',
    'Split by Item',
    'Free Online Tool',
  ],
  openGraph: {
    type: 'website',
    title: 'Bill Splitter',
    description:
      'Add diners, items, tax and tip → who owes what. Free and offline.',
    url: 'https://auxbox.tools/bill-splitter',
  },
  twitter: {
    card: 'summary',
    title: 'Bill Splitter',
    description:
      'Split a restaurant bill by item. Free and offline.',
  },
  alternates: {
    canonical: 'https://auxbox.tools/bill-splitter',
  },
};

export default function BillSplitterLayout({children}) {
  return children;
}

BillSplitterLayout.propTypes = {
  children: PropTypes.node.isRequired,
};
