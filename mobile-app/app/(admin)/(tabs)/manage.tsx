import { Redirect } from 'expo-router';

// The Manage tab press is intercepted in the layout to open the right drawer,
// so this screen is never shown. Redirect defensively if reached directly.
export default function ManagePlaceholder() {
  return <Redirect href="/(admin)" />;
}
