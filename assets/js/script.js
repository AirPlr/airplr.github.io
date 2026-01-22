/* assets/js/script.js
   Handles nav active state, smooth scrolling and basic slide indicator behaviour.
   Requires jQuery loaded before this script.
*/

(function($){
  $(function(){
    var $nav = $('nav'),
        $ul = $nav.find('ul'),
        $li = $ul.find('li').not('.slide');

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
    });

    // if non-anchor li clicked (future), toggle active
    $li.not(':has(a)').on('click', function(){
      $li.removeClass('active');
      $(this).addClass('active');
    });
  });
})(jQuery);
