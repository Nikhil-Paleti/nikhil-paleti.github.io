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

window.addEventListener('scroll', function() {
    const nav = document.querySelector('nav');
    if (window.scrollY > 0) {
        nav.classList.add('scrolled');
    } else {
        nav.classList.remove('scrolled');
    }
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


document.addEventListener('DOMContentLoaded', function() {
    const modal = document.getElementById('project-modal');
    const modalContent = document.getElementById('modal-project-content');
    const closeBtn = document.querySelector('.close');
    const viewDetailsBtns = document.querySelectorAll('.view-details-btn');

    viewDetailsBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            const projectCard = this.closest('.project-card');
            const projectDetails = projectCard.querySelector('.project-details').innerHTML;
            const projectTitle = projectCard.querySelector('h4').textContent;

            modalContent.innerHTML = `<h3>${projectTitle}</h3>${projectDetails}`;
            modal.style.display = 'block';
        });
    });

    closeBtn.onclick = function() {
        modal.style.display = 'none';
    }

    window.onclick = function(event) {
        if (event.target == modal) {
            modal.style.display = 'none';
        }
    }
});