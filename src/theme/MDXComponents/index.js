import MDXComponents from '@theme-original/MDXComponents';
import Table from './Table';

// Preserve every original mapping, including h1 and its owner's title handling.
export default {...MDXComponents, table: Table};
