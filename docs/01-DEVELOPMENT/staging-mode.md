
# Staging Mode

This document explains how the staging mode works in the Lead-Reviver application.

## Overview

The staging environment provides a way to test the application with real production data without requiring authentication. It's accessible through a specific path prefix: `/stagintestamitenv`.

## Implementation Details

- **Staging Path**: Any URL path starting with `/stagintestamitenv` is considered a staging route.
- **Auth Bypass**: Staging routes bypass the authentication requirements that protect production routes.
- **Database Access**: Staging mode uses the same Supabase project and tables as production.
- **Visual Indicator**: An orange banner displays at the top of every staging page to clearly indicate it's a staging environment.
- **SEO Protection**: All staging pages include a `<meta name="robots" content="noindex">` tag to prevent search engine indexing.

## Local Development

- For local testing, you can append `?auth=off` to any URL when running on localhost to bypass authentication.
- This parameter has no effect in production environments.

## Security Considerations

- **Access Control**: Anyone with knowledge of the staging URL can access and modify production data.
- **Keep URL Private**: The staging URL should not be shared publicly.
- **Data Integrity**: Be cautious when making changes in staging mode, as they directly affect production data.
- **Monitoring**: Consider implementing additional logging for actions performed in staging mode.

## Recommended Practices

1. Use staging mode only for testing and demonstration purposes.
2. Consider implementing an IP allow-list or basic authentication for additional security.
3. Regularly review actions performed in staging mode.
4. Consider implementing feature flags to limit certain operations in staging mode.
