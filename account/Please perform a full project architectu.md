Please perform a full project architecture reorganization and structural refactor.

The goal is to transform the entire codebase into a clean, modular, scalable, and professional enterprise-grade structure.

Do not only fix code issues — reorganize the entire project layout and move files into the correct folders based on their responsibility.

1) Full Project Structure Reorganization

Scan the entire project and reorganize all files and folders into a clean, maintainable structure.

Please move every file into its proper logical location.

Required folder organization
Frontend Structure

Organize the frontend into clearly separated folders such as:

src/pages
src/components
src/layouts
src/routes
src/services
src/hooks
src/context
src/store
src/utils
src/constants
src/types
src/styles
src/assets
src/locales
src/config
src/middleware (if frontend guards exist)
src/features
src/dashboard
src/shared

Move all files into the correct folder based on purpose.

Examples:

route definitions → routes
global styles / css / scss → styles
API calls → services
reusable UI → components
page-level views → pages
hooks → hooks
auth logic → context or store
2) Backend Structure Reorganization

Reorganize backend into a professional server architecture.

Required structure:

src/routes
src/controllers
src/services
src/models
src/middlewares
src/utils
src/config
src/validators
src/helpers
src/constants
src/types
src/database
src/scripts
src/jobs
src/modules

Move all backend files into the correct folders.

Examples:

express routes → routes
business logic → services
auth middleware → middlewares
DB schemas → models
validation schemas → validators
3) Feature-Based Modularization

Where appropriate, group related code by feature/module.

Example:

dashboard
users
classes
teachers
students
subjects
books
finance
notifications
reports
authentication

Each feature should contain its own:

routes
components
services
types
pages
translations

Example structure:
src/features/dashboard
src/features/users
src/features/classes

4) Import Path Cleanup

After moving files, automatically update all import and export paths.

Required tasks:

fix broken imports
remove circular dependencies
standardize alias paths
use absolute imports where possible
update tsconfig path aliases
update Vite aliases

Example:

@/components
@/services
@/features
5) Style File Organization

Move all style-related files into proper structure.

Required folders:

styles/global
styles/components
styles/layouts
styles/themes
styles/rtl
styles/ltr

Separate:

global styles
component styles
theme styles
RTL / LTR styles
6) Translation File Organization

Organize translation files by language and module.

Example:

locales/en/dashboard.json
locales/fa/dashboard.json
locales/ps/dashboard.json

Split large translation files into modular namespaces.

Example:

auth
dashboard
users
settings
forms
7) Remove Duplicate and Dead Code

Scan for:

duplicate components
duplicate services
duplicate routes
unused utilities
dead code
unused imports
orphan files

Remove or merge them.

8) Naming Standardization

Apply consistent naming conventions.

Examples:

PascalCase for components
camelCase for utilities
kebab-case for folders if needed
consistent file naming
9) Final Validation

After restructuring:

run full build
fix all import errors
verify frontend routes
verify backend routes
verify dashboard functionality
verify translation system
verify RTL / LTR behavior
10) Final Report

Provide a report including:

old structure issues
new folder structure
files moved
duplicate files removed
updated imports
architectural improvements

Apply all changes directly to the project files.