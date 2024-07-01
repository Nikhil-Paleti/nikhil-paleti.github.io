const rot13 = (message) => {
    const alpha = 'abcdefghijklmnopqrstuvwxyzabcdefghijklmABCDEFGHIJKLMNOPQRSTUVWXYZABCDEFGHIJKLM';
    return message.replace(/[a-z]/gi, letter => alpha[alpha.indexOf(letter) + 13]);
}

let e_is_shown = false;

document.getElementById('iemail').addEventListener("click", function(){
    let demail = document.getElementById('demail');
    let msg = "avxuvynpp16" + "@" + "tznvy.pbz<oe>" + "acnyrgv@hpfq.rqh";
    demail.innerHTML = rot13(msg);
    demail.style.opacity = e_is_shown ? 0 : 1;
    e_is_shown = !e_is_shown;
});

document.getElementById('menu-toggle').addEventListener('click', function(){
    const menu = document.getElementById('mobile-menu');
    menu.classList.toggle('open');
});

document.addEventListener('DOMContentLoaded', () => {
    const navLinks = document.querySelectorAll('.nav-link');
    const menu = document.getElementById('mobile-menu');

    navLinks.forEach(link => {
        link.addEventListener('click', event => {
            event.preventDefault();
            const targetId = link.getAttribute('href').substring(1);
            const targetSection = document.getElementById(targetId);
            
            if (targetSection) {
                window.scrollTo({
                    top: targetSection.offsetTop,
                    behavior: 'smooth'
                });

                // Hide the menu after clicking a link
                if (menu.classList.contains('open')) {
                    menu.classList.remove('open');
                }
            }
        });
    });
});
