
	// SERIALIZE OBJECT
	(function($,a){$.fn.serializeObject=function(){var b={};$.each(this.serializeArray(),function(d,e){var f=e.name,c=e.value;b[f]=b[f]===a?c:$.isArray(b[f])?b[f].concat(c):[b[f],c]});return b}})(jQuery);

    function on_click(event){
    	
        handle_search_request(event,'1', event.data.from, event.data.form)
    }

   function on_click_adv(event){
    	
        event.preventDefault(); 
        send_search_request('1', event.data.from, event.data.form);
    }

        function handle_search_request(event, page_num, from, form){
            //to prevent the opening of the search_button_Drop_down_menu
            event.preventDefault();
            
            if ($("#search_input") =='undefined' || validate_input($("#search_input").val()) == false){
			    $('#search_input').val('Blank or invalid input');
			    $("#search_box").addClass("error");
			    $('#search_list').spin(false);
			    $('#search_option_button').removeClass('disabled');
		    }
			
		    else{
		     send_search_request(page_num, from, form);
            }   
    }     

	function send_search_request(page_num, from, form){	  
	$('#graph_button').css("display", "none"); 
	if ($("#search_list") !='undefined'){
        $('#search_list').spin(true);
	    $('#search_option_button').addClass('disabled')
	}
	
 		switch(from)
			{
				case 'inevent':
	                search_form = $('#'+form).serializeObject();
		            Dajaxice.inevent.call_inevent_search(display_results, {'form': search_form, 'page_num' : page_num },{'error_callback': search_ajax_error});
		            break;

		}		
					
	}
	


	function display_results(data) {
      //  $('#search_list').css('display', '');
      //  $('#search_list').html("");
        $('#search_list').spin(false);
        $('#search_option_button').removeClass('disabled')
        $('#search_list').html(data);
        if ($('#adv_search')!=undefined)
    		$('#adv_search').modal('hide');
       // $( "input[name='speaker']" ).val("");
	}
	
	function search_ajax_error() {
		alert('Due to some technical problems, we could not process your request. Please try again later');
		$('#search_list').spin(false);
		$('#search_option_button').removeClass('disabled');
	}
	
	function validate_input(inputValue){
   		if(inputValue== '' || inputValue.length<2 || !inputValue.match(/^[a-zA-Z0-9-_ ]+$/))
             return false;
        else
             return true;
	}
	
	function clear_search_box()
	{
	  $('#graph_button').css("display", "none");	
	  if ($("#search_box")!='undefined' && $("#search_box").attr('class').indexOf('error')!=-1)
	  {
	  		$("#search_box").removeClass("error");
			$("#search_input").val("");
	  	}	
	}
	
	function on_key_press(event)
	{
		if (event.keycode == 13 || event.which == 13)
		
		{   
		
			handle_search_request(event,'1',event.data.from,event.data.form);
		}	
	}
	
	function update_select_option(option, v){
		$('#search_option_button').html(option);
		$('#search_option_button').append('&nbsp;<span class="caret"></span>');
		var $radios = $('input:radio[name=searchable]')
		if($radios.is(':checked')!='undefined') {
			$radios.removeAttr('checked');
		}
    	$radios.filter(('[value="' + v + '"]')).prop('checked', true);
	}