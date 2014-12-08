import math

class Pagination(object):
    def __init__(self, num_items_total, num_items_per_page):
        self.num_items_total = num_items_total
        self.num_items_per_page = num_items_per_page
#        float is applied to first number so that for the case of a small number divided by a bigger one, ceil returns 1 instead 0
#        and for cases where num_items_total/number_of_items_per_page  yields an integer, we get this exact integer
        self.num_pages = int(math.ceil(float(num_items_total) / num_items_per_page))
            
    def page(self, page):
        try: 
            self.page = int(page)
        except ValueError:
            self.page = 1 #If page is not an int, default first page
    
        #Check for range validity
        if self.page > self.num_pages:
            self.page = self.num_pages
        if self.page < 1:
            self.page = 1
    
        #Setting hasPrevious and hasNext
        if self.num_pages > 1:
            self.has_previous = False if self.page == 1 else True
            self.has_next = False if self.page == self.num_pages else True
        else:
            self.has_previous = False
            self.has_next = False
    
        # Computing range
        self.range_start = (self.page - 1) * self.num_items_per_page
        self.range_end = (self.page * self.num_items_per_page)
        #Check for range validity
        if self.range_start < 0:
            self.range_start = 0
        if self.range_end > self.num_items_total:
            self.range_end = self.num_items_total
    
        #Computing previous and next pages    
        self.previous_page_number = self.page-1 if self.has_previous else None
        self.next_page_number = self.page+1 if self.has_next else None

