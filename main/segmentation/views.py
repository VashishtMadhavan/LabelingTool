from django.shortcuts import render
from django.http import Http404, HttpResponse
from ua_parser import user_agent_parser
import ast

from django.shortcuts import render
from django.views.decorators.csrf import ensure_csrf_cookie
from segmentation.models import Image, LabelName, Segment
from django.conf import settings
from django.views.decorators.clickjacking import xframe_options_exempt

MIN_VERTICES = 4

# Create your views here.
@ensure_csrf_cookie
def index(request):
	context = {'next_photo': '1'}
	return render(request, 'index.html', context)

@ensure_csrf_cookie
def question(request,image_id):
    context = {}
    context['current_id'] = str(image_id)
    context['reviewed'] = Image.objects.get(id=image_id).reviewed
    next_image_id = Image.objects.filter(annotated=False)[0].id
    context['next_photo_id'] = str(next_image_id)
    return render(request,'question.html', context)

@ensure_csrf_cookie
def segment(request, image_id):
    if request.method == 'POST':
        results = ast.literal_eval(request.POST['results'])
        labels = ast.literal_eval(request.POST['labels'])

        pointList = results[str(image_id)]
        labelList = labels[str(image_id)]
        imageObj  = Image.objects.get(id=image_id)
        imageObj.annotated = True
        imageObj.save()

        for i in range(len(pointList)):
            vertexStr = ','.join([str(x) for x in points])
            label =  labelList[i]
            labelObj = LabelName.objects.get(name=label)

            segment = Segmentation(image=imageObj, label=labelObj, coords=vertexStr)
            segment.save()
        return json_success_response()
    else:
    	response = browser_check(request)
    	image = Image.objects.get(id=image_id)
    	context = {}
    	context['content'] = {'id': image_id, 'url': image.image.url}
    	context['min_vertices'] = MIN_VERTICES
    	context['instructions'] = 'segment/segment_inst_content.html'

        # constructing label list for labeling modal
        labels = [str(l.name) for l in LabelName.objects.all()]
        label_body = '<select id="label_list">'
        for l in labels:
            label_body += '<option value="%s">%s</option>' %(l,l)
        label_body += '</select>'
        
        context['labels'] = label_body
    	response = render(request, 'segment/segment.html', context)
    	response['x-frame-options'] = 'EXEMPT'
    	return response

@ensure_csrf_cookie
def review(request, image_id):
	return HttpResponse("The best at %s" %(str(image_id)))

def html_error_response(request, error):
    return render(request, "error.html", {'message': error})

def json_success_response():
    return HttpResponse(
        '{"message": "success", "result": "success" }',
        content_type='application/json')

def browser_check(request):
    """ Only allow firefox and chrome, and no mobile """
    valid_browser = False
    if 'HTTP_USER_AGENT' in request.META:
        ua = user_agent_parser.Parse(request.META['HTTP_USER_AGENT'])
        if ua['user_agent']['family'].lower() in ('firefox', 'chrome'):
            device = ua['device']
            if 'is_mobile' not in device or not device['is_mobile']:
                valid_browser = True
    if not valid_browser:
        return html_error_response(
            request, '''
            This task requires Google Chrome. <br/><br/>
            <a class="btn" href="http://www.google.com/chrome/"
            target="_blank">Get Google Chrome</a>
        ''')
    return None