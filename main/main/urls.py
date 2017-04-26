from django.conf.urls import patterns, include, url
from segmentation import views
from django.contrib import admin
from django.conf import settings
admin.autodiscover()


urlpatterns = patterns('',
    # Examples:
    # url(r'^$', 'main.views.home', name='home'),
    # url(r'^blog/', include('blog.urls')),
    url(r'^admin/', include(admin.site.urls)),
    url(r'^$', views.index, name='index'),
    url(r'^segment/(?P<image_id>\d+)/$', views.segment, name='segment'),
    url(r'^review/(?P<image_id>\d+)/$', views.review, name='review'),
    url(r'^question/(?P<image_id>\d+)/$',views.question, name="question"),
    url(r'^review/(?P<image_id>\d+)/$', views.review, name='review'),
    (r'^media/(?P<path>.*)$', 'django.views.static.serve',{'document_root': settings.MEDIA_ROOT}),
)
