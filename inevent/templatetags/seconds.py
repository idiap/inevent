from django import template
import datetime

register = template.Library()


@register.filter
def seconds(value, arg):
    if not value:
        return ""
    seconds = int(value)
    hours = seconds / 3600
    seconds -= 3600 * hours
    minutes = seconds / 60
    seconds -= 60 * minutes
    if hours == 0:
        return "%02d:%02d" % (minutes, seconds)
    return "%02d:%02d:%02d" % (hours, minutes, seconds)
