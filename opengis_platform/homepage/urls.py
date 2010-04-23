from django.conf.urls.defaults import *

urlpatterns = patterns('homepage.views',
	url(r'^$', 'view_homepage', name='view_homepage'),
)