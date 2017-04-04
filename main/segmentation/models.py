from django.db import models

# Create your models here.

class Image(models.Model):
	filename = models.CharField(max_length=200,unique=True)
	#will be uploaded to MEDIA_ROOT/images
	image = models.ImageField(upload_to="images/")
	width = models.IntegerField(default=0)
	height = models.IntegerField(default=0)
	annotated = models.BooleanField(default=False)

	def __unicode__(self):
		return self.filename

	def save(self, *args, **kwargs):
		if not self.name:
			self.filename = self.image.name
		if not self.width:
			self.width = self.image.width
		if not self.height:
			self.height = self.image.height
		super(Image, self).save(*args, **kwargs)


class Label(models.Model):
	image = models.ForeignKey(Image)
	label = models.CharField(max_length=200)
	coords = models.TextField() ##storing list of points as string of x1,y1,x2,y2,etc.
	num_vertices = models.IntegerField()

	def __unicode__(self):
		return self.image.filename + '_' + self.label

	def save(self, *args, **kwargs):
		if not self.num_vertices:
			self.num_vertices = len(self.coords.split(',')) // 2
		super(Label, self).save(*args, **kwargs)


