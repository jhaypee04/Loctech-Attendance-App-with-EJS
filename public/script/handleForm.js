// var module_form = document.querySelector('.module_form')
// console.log(module_form)

// module_form.addEventListener('submit', function(e){
//     e.preventDefault()
//     // alert('Module Register sent')
//     const wkNo = e.target.elements.weekNo.value
//     const dOM = e.target.elements.dayOfModule.value
//     const tOM = e.target.elements.titleOfModule.value
//     const className = e.target.elements.className.value

//     const data = {wkNo,dOM,tOM,className}

//     fetch('/insertModule',{
//         method: 'POST',
//         headers: {
//             'Content-Type': 'application/json'
//         },
//         body: JSON.stringify(data)
//     })
// })