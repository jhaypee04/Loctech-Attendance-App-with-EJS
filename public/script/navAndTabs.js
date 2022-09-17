// Navs and Tabs Code
var navs = document.querySelectorAll('.tab-toggler')
var tabs = document.querySelectorAll('.tabs')

navs.forEach((nav) => {
    nav.addEventListener('click', ()=>{
        // gets the nav that was clicked; eg: tab1
        var clicked_nav = nav.href.slice(-4)
        // console.log(clicked_nav)
        // console.log(nav)
        tabs.forEach((tab) => {
            // console.log(tab)
            // conditional check
            if(tab.id == clicked_nav ) {
                tab.classList.remove('hide')
                tab.classList.add('show')
            }else{
                tab.classList.remove('show')
                tab.classList.add('hide')
            }
        })
        
    })
})

// Accordion Code for Modules
var week_x = document.querySelector('.day_and_module_header')
var week_x_contianer = document.querySelector('.accordion_hidden')

week_x.addEventListener('click', () => {
    if(week_x_contianer.style.display == 'block'){
        week_x_contianer.style.display = 'none'
    } else {
        week_x_contianer.style.display = 'block'
    }
} )


// Accordion Code for Student
var student_name = document.querySelector('.student_name')
var student_details_contianer = document.querySelector('.accordion_hidden_student')

student_name.addEventListener('click', () => {
    if(student_details_contianer.style.display == 'block'){
        student_details_contianer.style.display = 'none'
    } else {
        student_details_contianer.style.display = 'block'
    }
} )