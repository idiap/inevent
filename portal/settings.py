# Django settings for portal project.
import os.path

#SOUTH_TESTS_MIGRATE = False # To disable migrations and use syncdb instead
#SKIP_SOUTH_TESTS = True # To disable South's own unit tests

DEBUG = False
TEMPLATE_DEBUG = DEBUG

SESSION_ENGINE = "django.contrib.sessions.backends.signed_cookies" 

TIME_ZONE = 'Europe/Zurich'

# Language code for this installation. All choices can be found here:
# http://www.i18nguy.com/unicode/language-identifiers.html
LANGUAGE_CODE = 'en-gb'


# If you set this to False, Django will make some optimizations so as not
# to load the internationalization machinery.
USE_I18N = True

# If you set this to False, Django will not format dates, numbers and
# calendars according to the current locale
USE_L10N = True

# If you set this to False, Django will not use timezone-aware datetimes.
#USE_TZ = True

PROJECT_ROOT = os.path.join(os.path.dirname(os.path.realpath(__file__)), '..')

SERVER_PATH = PROJECT_ROOT+'/static/'

# Absolute path to the directory static files should be collected to.
# Don't put anything in this directory yourself; store your static files
# in apps' "static/" subdirectories and in STATICFILES_DIRS.
# Example: "/home/media/media.lawrence.com/static/"
STATIC_ROOT = '/var/www/static/inevent_project/'

# NEW SINCE DJANGO 1.4
# sudo ln -s /usr/local/lib/python2.7/dist-packages/django/contrib/admin/static/admin
# in /var/www (remove Nginx directive for adminmedia)
# URL prefix for static files.
# Example: "http://media.lawrence.com/static/"
STATIC_URL = '/static/inevent_project/'

# Additional locations of static files
STATICFILES_DIRS = (
   os.path.join(os.path.dirname(__file__), '../static/'),
    # Put strings here, like "/home/html/static" or "C:/www/django/static".
    # Always use forward slashes, even on Windows.
    # Don't forget to use absolute paths, not relative paths.
)

# List of finder classes that know how to find static files in
# various locations.
STATICFILES_FINDERS = (
    'django.contrib.staticfiles.finders.FileSystemFinder',
    'django.contrib.staticfiles.finders.AppDirectoriesFinder',
    'dajaxice.finders.DajaxiceFinder',
)



# List of callables that know how to import templates from various sources.
TEMPLATE_LOADERS = (
    #'django.template.loaders.filesystem.load_template_source',
    #'django.template.loaders.app_directories.load_template_source',
    'django.template.loaders.filesystem.Loader',
    'django.template.loaders.app_directories.Loader',
    # uncommented last line for dajaxice: http://docs.dajaxproject.com/dajaxice/installation.html
    'django.template.loaders.eggs.Loader',
)

MIDDLEWARE_CLASSES = (
    #'django.middleware.gzip.GZipMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'raven.contrib.django.middleware.Sentry404CatchMiddleware',
    'raven.contrib.django.middleware.SentryResponseErrorIdMiddleware',
)


# Python dotted path to the WSGI application used by Django's runserver.
WSGI_APPLICATION = 'portal.wsgi.application'

TEMPLATE_DIRS = (
    # Put strings here, like "/home/html/django_templates" or "C:/www/django/templates".
    # Always use forward slashes, even on Windows.
    # Don't forget to use absolute paths, not relative paths.
    os.path.join(os.path.dirname(__file__), '../templates'),
    #'/srv/www/portal.klewel.com/application/portal/templates',
)

INSTALLED_APPS = (
    'django.contrib.contenttypes',
    'django.contrib.staticfiles',
    'django.contrib.sessions',
    'inevent',
    'endless_pagination', # testing
    'dajaxice',
    'raven.contrib.django',

)

DAJAXICE_MEDIA_PREFIX="dajaxice"

ROOT_URLCONF = 'portal.urls'

from django.conf.global_settings import TEMPLATE_CONTEXT_PROCESSORS
TEMPLATE_CONTEXT_PROCESSORS += (
     'django.core.context_processors.request',
)

LOGGING = {
    'version': 1,
    'disable_existing_loggers': True,
    'root': {
        'level': 'INFO',
        'handlers': ['sentry', 'console'],
        'propagate' : True,
    },
    'formatters': {
        'verbose': {
            'format': '%(levelname)s %(asctime)s %(module)s : %(message)s' # %(process)d %(thread)d
        },
    },
    'handlers': {
        'sentry': {
            'level': 'ERROR',
            'class': 'raven.contrib.django.handlers.SentryHandler',
        },
        'console': {
            'level': 'INFO',
            'class': 'logging.StreamHandler',
            'formatter': 'verbose'
        }
    },
    'loggers': {
        'django.db.backends': {
            'level': 'ERROR',
            'handlers': ['console'],
            'propagate': False,
        },
        'sentry.errors': {
            'level': 'DEBUG',
            'handlers': ['console'],
            'propagate': False,
        },
        
    },
}



# Importing local settings for dev environment
try:
    from settings_local import * #@UnusedWildImport
except ImportError as exc:
#    from datetime import datetime
    print u"*************************************************************"
    print u"******** No settings_local.py, running in PRODUCTION ********"
    print u"*************************************************************"
#    print str(datetime.time(datetime.now())) + u' File settings_local.py is not found. Continuing with production settings.'
#    print str(exc)
