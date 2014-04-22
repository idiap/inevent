# Everything that is not taken by the root URLS, eat it here! 
from django.conf.urls.defaults import patterns, url, include, handler404, handler500 #@UnusedImport
from django.contrib.auth import views as auth_views
from inevent.email_auth import MyAuthenticationForm
from inevent.views.portal import portal, get_hyperevent
from inevent.views.alignment import alignment_index, align, edit, update

urlpatterns = patterns('',
  url(r'^inevent_portal/hyperevent/(?P<id>\d+)', get_hyperevent, name='get_hyperevent'),
  url(r'^inevent_portal/alignment/(.*)/edit$', edit, name='hyperevent_edit'),
  url(r'^inevent_portal/alignment/(.*)/update$', update, name='hyperevent_update'),
  url(r'^inevent_portal/alignment/(.*)/align$', align, name='hyperevent_align'),
  url(r'^inevent_portal/alignment/(.*)$', alignment_index, name='alignment_index'),
  url(r'^inevent_portal', portal, name='inevent'),
)
