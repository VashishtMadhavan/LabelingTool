from segmentation.models import Image, LabelName
from django.core.files import File

labelFile = "labels.txt"
imageFile = "images.txt"

labels = [x.rstrip() for x in open(labelFile).readlines()]
images = [x.rstrip() for x in open(imageFile).readlines()]

print "Creating Label objects..."
for l in labels:
    labelObj = LabelName(name=l)
    labelObj.save()


print "Creating Image objects..."
for im in images:
    fname = im.split('/')[-1]
    imObj = Image(filename=fname, image=File(open(im,'r')))
    imObj.save()
