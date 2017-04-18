from django.contrib import admin
from segmentation.models import Image, LabelName, Segment

# Register your models here.
admin.site.register(Image)
admin.site.register(LabelName)
admin.site.register(Segment)
