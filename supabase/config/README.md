# 📁 Supabase Configuration

## 📋 **Directory Purpose**
Configuration files for Supabase project setup and deployment.

## 📄 **Files**

### `config.toml`
- **Purpose**: Main Supabase CLI configuration file
- **Contains**: Project settings, API URLs, database configuration
- **Used by**: Supabase CLI for local development and deployment
- **Do not modify**: Unless you understand Supabase configuration

## 🔧 **Best Practices**

### **Configuration Management**
- Keep configuration files in version control
- Use environment-specific settings when needed
- Document any manual changes to config.toml

### **Security Notes**
- This file contains project references but no sensitive credentials
- Sensitive keys should be in environment variables or credential files
- Never commit actual API keys or passwords to this directory

## 📞 **Related Documentation**
- Main Supabase documentation: `../docs/`
- Setup guides: `../docs/guides/`
- Environment setup: `../docs/guides/ENVIRONMENT_SETUP_SECURE.md` 