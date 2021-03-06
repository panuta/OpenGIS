import os
_base = os.path.dirname(__file__)

DEBUG = True
TEMPLATE_DEBUG = DEBUG

##FORCE_SCRIPT_NAME = '/opengis'
WEBSITE_ADDRESS = 'localhost:8000'

ADMINS = (
    # ('Your Name', 'your_email@domain.com'),
)

MANAGERS = ADMINS

DATABASE_ENGINE = 'postgresql_psycopg2'           # 'postgresql_psycopg2', 'postgresql', 'mysql', 'sqlite3' or 'oracle'.
DATABASE_NAME = 'opengis_dev'             # Or path to database file if using sqlite3.
DATABASE_USER = 'opengis_dev'             # Not used with sqlite3.
DATABASE_PASSWORD = 'opengis_dev'         # Not used with sqlite3.
DATABASE_HOST = ''             # Set to empty string for localhost. Not used with sqlite3.
DATABASE_PORT = ''             # Set to empty string for default. Not used with sqlite3.

TIME_ZONE = 'Asia/Bangkok'
LANGUAGE_CODE = 'en-us'

SITE_ID = 1

# If you set this to False, Django will make some optimizations so as not
# to load the internationalization machinery.
USE_I18N = True

MEDIA_ROOT = os.path.join(_base, "media") + "/"
MEDIA_URL = '/m'
##MEDIA_URL = '/om'
ADMIN_MEDIA_PREFIX = '/media/'

# Make this unique, and don't share it with anybody.
SECRET_KEY = '9$*v@l_npa77k#^=dmx3^tdxb%zb*w$4e43t221xn%@ft&*tl7'

# List of callables that know how to import templates from various sources.
TEMPLATE_LOADERS = (
    'django.template.loaders.filesystem.load_template_source',
    'django.template.loaders.app_directories.load_template_source',
#     'django.template.loaders.eggs.load_template_source',
)

MIDDLEWARE_CLASSES = (
	'middleware.AJAXSimpleExceptionResponse',
	'django.middleware.common.CommonMiddleware',
	'django.contrib.sessions.middleware.SessionMiddleware',
	'django.contrib.auth.middleware.AuthenticationMiddleware',
)

ROOT_URLCONF = 'opengis_platform.urls'

LOGIN_REDIRECT_URL = "/my/projects/"
AUTH_PROFILE_MODULE = 'accounts.UserProfile'
ACCOUNT_ACTIVATION_DAYS = 3

TEMPLATE_DIRS = (
	os.path.join(_base, "templates"),
)

INSTALLED_APPS = (
	'django.contrib.admin',
	'django.contrib.auth',
	'django.contrib.contenttypes',
	'django.contrib.sessions',
	'django.contrib.sites',
	'registration',
	'opengis_platform.homepage',
	'opengis_platform.accounts',
	'opengis_platform.project',
	'opengis_platform.workspace',
)

# OPENGIS #
TABLE_SPATIAL_COLUMN_NAME = 'spatial'