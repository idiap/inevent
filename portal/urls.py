from django.conf.urls.defaults import patterns, include, handler404, handler500 #@UnusedImport
from django.conf import settings
#from django.contrib import admin
#from django.conf.urls.static import static
from django.conf.urls.defaults import url


urlpatterns = patterns('',
     url(r'^', include('inevent.urls')),
)

from dajaxice.core import dajaxice_autodiscover
dajaxice_autodiscover()
if 'dajaxice' in settings.INSTALLED_APPS:
    urlpatterns += patterns('',
        url(r'^%s/' % settings.DAJAXICE_MEDIA_PREFIX, include('dajaxice.urls')),
    )

   #patterns('',
    # Admin docs and admin
     # (r'^admin/doc/', include('django.contrib.admindocs.urls')),
     # (r'^admin/', include(admin.site.urls)),





