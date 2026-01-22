/* assets/js/script.js
   Handles nav active state, smooth scrolling and basic slide indicator behaviour.
   Requires jQuery loaded before this script.
*/

(function($){
  $(function(){
    var $nav = $('nav'),
        $ul = $nav.find('ul'),
        $li = $ul.find('li').not('.slide');
    var $toggle = $('.nav-toggle');

    // set first as active by default
    $li.removeClass('active');
    $li.first().addClass('active');

    // click -> set active and smooth scroll to anchors
    $li.find('a').on('click', function(e){
      var href = $(this).attr('href');
      if (href && href.charAt(0) === '#') {
        e.preventDefault();
        var $target = $(href);
        if ($target.length) {
          var offset = $target.offset().top;
          $('html, body').animate({ scrollTop: offset }, 500);
        }
      }
      $li.removeClass('active');
      $(this).closest('li').addClass('active');
      // close mobile nav if open
      if(window.innerWidth <= 700) {
        $ul.removeClass('open');
        $toggle.attr('aria-expanded', 'false');
      }
    });

    // Hamburger toggle
    $toggle.on('click', function(){
      var expanded = $ul.hasClass('open');
      $ul.toggleClass('open');
      $toggle.attr('aria-expanded', !expanded);
    });

    // Close nav on resize if desktop
    $(window).on('resize', function(){
      if(window.innerWidth > 700) {
        $ul.removeClass('open');
        $toggle.attr('aria-expanded', 'false');
      }
    });
  });
})(jQuery);
