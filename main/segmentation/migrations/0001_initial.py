# -*- coding: utf-8 -*-
from south.utils import datetime_utils as datetime
from south.db import db
from south.v2 import SchemaMigration
from django.db import models


class Migration(SchemaMigration):

    def forwards(self, orm):
        # Adding model 'Image'
        db.create_table(u'segmentation_image', (
            (u'id', self.gf('django.db.models.fields.AutoField')(primary_key=True)),
            ('filename', self.gf('django.db.models.fields.CharField')(unique=True, max_length=200)),
            ('image', self.gf('django.db.models.fields.files.ImageField')(max_length=100)),
            ('width', self.gf('django.db.models.fields.IntegerField')(default=0)),
            ('height', self.gf('django.db.models.fields.IntegerField')(default=0)),
            ('annotated', self.gf('django.db.models.fields.BooleanField')(default=False)),
        ))
        db.send_create_signal(u'segmentation', ['Image'])

        # Adding model 'Label'
        db.create_table(u'segmentation_label', (
            (u'id', self.gf('django.db.models.fields.AutoField')(primary_key=True)),
            ('image', self.gf('django.db.models.fields.related.ForeignKey')(to=orm['segmentation.Image'])),
            ('label', self.gf('django.db.models.fields.CharField')(max_length=200)),
            ('coords', self.gf('django.db.models.fields.TextField')()),
            ('num_vertices', self.gf('django.db.models.fields.IntegerField')()),
        ))
        db.send_create_signal(u'segmentation', ['Label'])


    def backwards(self, orm):
        # Deleting model 'Image'
        db.delete_table(u'segmentation_image')

        # Deleting model 'Label'
        db.delete_table(u'segmentation_label')


    models = {
        u'segmentation.image': {
            'Meta': {'object_name': 'Image'},
            'annotated': ('django.db.models.fields.BooleanField', [], {'default': 'False'}),
            'filename': ('django.db.models.fields.CharField', [], {'unique': 'True', 'max_length': '200'}),
            'height': ('django.db.models.fields.IntegerField', [], {'default': '0'}),
            u'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'image': ('django.db.models.fields.files.ImageField', [], {'max_length': '100'}),
            'width': ('django.db.models.fields.IntegerField', [], {'default': '0'})
        },
        u'segmentation.label': {
            'Meta': {'object_name': 'Label'},
            'coords': ('django.db.models.fields.TextField', [], {}),
            u'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'image': ('django.db.models.fields.related.ForeignKey', [], {'to': u"orm['segmentation.Image']"}),
            'label': ('django.db.models.fields.CharField', [], {'max_length': '200'}),
            'num_vertices': ('django.db.models.fields.IntegerField', [], {})
        }
    }

    complete_apps = ['segmentation']