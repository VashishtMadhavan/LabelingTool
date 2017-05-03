from django.conf.urls import url
from django.contrib import admin
from segmentation import views
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    # Examples:
    # url(r'^$', 'main.views.home', name='home'),
    # url(r'^blog/', include('blog.urls')),
    url(r'^admin/', admin.site.urls),
    url(r'^$', views.index, name='index'),
    url(r'^segment/(?P<image_id>\d+)/$', views.segment, name='segment'),
    url(r'^review/(?P<image_id>\d+)/$', views.review, name='review'),
    url(r'^question/(?P<image_id>\d+)/$',views.question, name="question"),
    url(r'^review/(?P<image_id>\d+)/$', views.review, name='review'),
] + static(settings.MEDIA_URL, document_root = settings.MEDIA_ROOT)
