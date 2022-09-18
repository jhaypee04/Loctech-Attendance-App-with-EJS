let menu_btn = document.querySelector('.menu_btn')
let drop_menu = document.querySelector('.drop_menu')

menu_btn.onclick = function(e){
    if(drop_menu.style.display == 'none'){
        drop_menu.style.display = 'flex'
    }
    else{
        drop_menu.style.display = 'none'
    }
    // console.log(e)
}