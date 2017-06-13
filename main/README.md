## Inital Setup
```
mkdir media/
mkdir static/
```

## Images and Labels

- create labels.txt with a list of categories you wish to label
- create images.txt with a list of paths to image files
	- these images should be in <i>media/</i>

## Database Creation
Running the command below creates adds the images in images.txt and labels in labels.txt to the database. As annotations are collected, they will be saved to the database and linked to these Image and Label objects.

```
python manage.py migrate
python manage.py makemigrations segmentation
python manage.py migrate
python manage.py shell < setup.py
```

## Running Server

Starts the server on a port you specify. Deployment of this application is left up to you. It can be used in multiple ways. The following command starts the server

```
./runserver
```
