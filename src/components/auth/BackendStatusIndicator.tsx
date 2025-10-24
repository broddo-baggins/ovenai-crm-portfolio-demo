// This component has been simplified as health checks are no longer needed
// We are using Supabase directly with proper RLS policies
const BackendStatusIndicator = () => {
  // Always return null since we don't need to show status
  return null;
};

export default BackendStatusIndicator;
