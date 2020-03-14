function myfunction(){
 var mast= document.querySelector("table");
    mast.style.backgroundColor="red";
}

var flag = 0;
var flag1 = 0;
function myfunction1(){
 var table= document.querySelector(".mast");

    var toggle= document.querySelector(".toggle");
    if(flag % 2 ==0){
      table.style.display="block";
      table.style.overflow="hidden";
      table.classList.add("animate");
      table.classList.remove("reverseAnimate");
      toggle.innerHTML = ' <a> <i class="fa fa-caret-square-o-up hilade" aria-hidden="true"></i> </a>';}
    else{
        table.style.overflow="hidden";
        table.classList.add("reverseAnimate");
        table.classList.remove("animate");
        toggle.innerHTML = ' <a> <i class="fa fa-caret-square-o-down hilade" aria-hidden="true"></i> </a>';
        setTimeout(function(){
            table.style.display="none";
        },1000);
    }
    flag++;
    if(flag == 10 )
      flag = 0;
}

function chgb(){
  var notvalid = document.querySelector(".notvalid");
  notvalid.textContent = "You Need To Log In First To Like Or Comment!";
}
function chgb1(){
  var valid = document.querySelector(".valid");
  valid.textContent = "We hope you really liked it!";
  valid.style.color = "forestgreen";
}
function chgb2(){
  var valid = document.querySelector(".valid");
  valid.textContent = "";
}

function showhide(){
  document.querySelector('.sc').style.display="block";
  document.querySelector('.sc').style.overflow="hidden";
  var sidebar = document.querySelector(".sidebar");

    var toggle= document.querySelector(".show-hide-arrow");
    if(flag1 % 2 ==0){
      sidebar.style.display="block";
      sidebar.style.overflow="hidden";
      sidebar.classList.add("animate2");
      sidebar.classList.remove("reverseAnimate2");
      toggle.innerHTML = ' <a><i class="fa fa-angle-double-left" aria-hidden="true" style="color:white;font-size:35px;">';}
    else{
        sidebar.style.overflow="hidden";
        sidebar.classList.add("reverseAnimate2");
        sidebar.classList.remove("animate2");
        toggle.innerHTML = '<a><i class="fa fa-angle-double-right" aria-hidden="true" style="color:black;font-size:35px;">';
        toggle.style.display="none";
        setTimeout(function(){
            document.querySelector('.sc').style.display="none";
            toggle.style.display="block";
        },500);


    }
    flag1++;
    if(flag1 == 10 )
      flag1 = 0;
    }

    var flag2 = 0;

    function showhide2(){
      document.querySelector('.slider2').style.display="block";
      document.querySelector('.slider2').style.overflow="hidden";
      var sidebar = document.querySelector(".sidebar2");

        var toggle= document.querySelector(".show-hide-arrow2");
        if(flag2 % 2 ==0){
          sidebar.style.display="block";
          sidebar.style.overflow="hidden";
          sidebar.classList.add("animate3");
          sidebar.classList.remove("reverseAnimate3");
          toggle.style.display = "none";}
        else{
            sidebar.style.overflow="hidden";
            sidebar.classList.add("reverseAnimate3");
            sidebar.classList.remove("animate3");
            setTimeout(function(){
                document.querySelector('.slider2').style.display="none";
                toggle.style.display ="block";
            },500);


        }
        flag2++;
        if(flag2 == 10 )
          flag2 = 0;
        }
