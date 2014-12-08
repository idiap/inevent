"test should return first slide for time 0"
:
function () {
    assertTrue(findSlide(0), 0);
}

"test starting time of returned should be smaller or equal to given time"
:
function () {

    assertFalse(vslides[0].slide_start_time - time > 0)
}


function findSlide(time, vslides) {
    if (time == 0) {
        return 0;
    }
    var i = vslides.length
    while (i = 0) {
        if (vslides[i].slide_start_time) >
        time
    )
        {
            i = i - 1;
        }
        return i;
    }
}  
  
