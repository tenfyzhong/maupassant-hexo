function incrementedKey(url) {
  return 'v_url' + escape(url);
}

function increment(counter) {
  counter.fetchWhenSave(true);
  counter.increment('time');
  counter.save(null, {
    success: function(counter) {
      sessionStorage.setItem(counter.get('url'), counter.get('time'));
    },
    error: function(counter, error) {
      console.log('Failed to save Visitor num, with error message: ' + error.message);
    }
  });
}

function setCount(Counter, url, countElement) {
  var newcounter = new Counter();

  var acl = new AV.ACL();
  acl.setPublicReadAccess(true);
  acl.setPublicWriteAccess(true);
  newcounter.setACL(acl);

  var $element = $(document.getElementById(url));
  var title = $element.attr('data-flag-title').trim();

  newcounter.set('title', title);
  newcounter.set('url', url);
  newcounter.set('time', 1);

  newcounter.save(null, {
    success: function(newcounter) {
      var time = newcounter.get('time');
      $element.find(countElement).text(time);
      sessionStorage.setItem(url, time);
    },
    error: function(newcounter, error) {
      $element.find(countElement).text(0);
      console.log('Failed to create, ' + error.message);
    }
  });
}

function processCounter(Counter, visitorElement, countElement) {
  var $visitors = $(visitorElement);
  var entries = [];
  $visitors.each(function(){
    entries.push($(this).attr('id').trim());
  });
  var query = new AV.Query(Counter);

  query.containedIn('url', entries);
  query.find()
    .then(function(results) {
      var processed = {}
      results.forEach(function(counter) {
        processed[counter.get('url')] = true;
        var $element = $(document.getElementById(counter.get('url')));
        if (!sessionStorage.getItem(counter.get('url'))) {
          increment(counter);
        }
        $element.find(countElement).text(counter.get('time'));
      });
      entries.forEach(function(entrie){
        if (!processed[entrie]) {
          setCount(Counter, entrie, countElement);
        }
      });
    });
}

function setSiteView(visitor, count) {
  var $element = $(document.getElementById('site-visitors-count'));
  var url = $element.find(visitor).attr('id').trim();
  var view = sessionStorage.getItem(url);
  if (view !== null && view > 0) {
    $element.find(count).text(view);
    return true;
  }
  return false;
}

$(function() {
  var $siteVisitor = $(document.getElementById('site-visitors-count'));
  $siteVisitor.on('DOMSubtreeModified', function(){
    $siteVisitor.show();
  });

  var VISITOR_ELEMENT = '.leancloud-visitors';
  var COUNT_ELEMENT = '.leancloud-visitors-count';

  setSiteView(VISITOR_ELEMENT, COUNT_ELEMENT);

  var Counter = AV.Object.extend('Counter');
  processCounter(Counter, VISITOR_ELEMENT, COUNT_ELEMENT);
});

