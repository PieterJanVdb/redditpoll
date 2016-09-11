const Express = require('express');
const bodyParser = require('body-parser');
const redis   = require("redis");
const session = require('express-session');
const redisStore = require('connect-redis')(session);
const snoowrap = require('snoowrap');
const htmlparser = require("htmlparser2");
const levenshtein = require('fast-levenshtein');
const stringify = require('csv-stringify');
const Entities = require('html-entities').AllHtmlEntities;

const app = new Express();
const entities = new Entities();
const client  = redis.createClient();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));

app.use(session({
    secret: process.env.SESSION_SECRET,
    store: new redisStore({ host: 'localhost', port: 6379, client: client,ttl: 86400}),
    saveUninitialized: false,
    resave: false
}));

app.use(Express.static('public'));

app.post('/generate_result', (req, res) => {
  const post = req.body.postId;
  const limit = req.body.limit;

  let foundList = false;
  let listCounter = 0;
  let result = {};
  let trackLists = [];
  let unparsedComments = [];

  if (!post) {
    return res.status(400).send('Please provide a PostID.');
  } else if (!/^[a-zA-Z0-9]{6}$/.test(post)) {
    return res.status(400).send('Please provide a valid PostID.');
  }

  if (!limit) {
    return res.status(400).send('Please provide a limit.');
  } else if ((typeof data === 'number' && (data % 1) === 0) || limit < 1) {
    return res.status(400).send('Please provide an integer above 0 as limit.');
  }

  const r = new snoowrap({
    client_id: process.env.CLIENT_ID,
    client_secret: process.env.CLIENT_SECRET,
    refresh_token: process.env.REFRESH_TOKEN,
    user_agent: 'u/Piegie @SnooPoll:1.0.0'
  });

  const parser = new htmlparser.Parser({
      onopentag: function(name, attribs){
        if(name === "ol"){
            foundList = true;
            trackLists[listCounter] = [];
        }
      },
      ontext: function(text){
        if (!foundList) return;
        if (text === '\n') return;
        trackLists[listCounter].push(entities.decode(text));
      },
      onclosetag: function(tagname){
        if(tagname === "ol"){
            foundList = false;
            listCounter += 1;
        }
      }
  }, {decodeEntities: false});

  r.getSubmission(post).expandReplies({ depth: 1 }).comments.then(comments => {
    comments.forEach(c => {
      if (c.body_html.indexOf('<ol>') === -1) {
        unparsedComments.push(c);
      } else {
        parser.write(c.body_html)
      }
    });

    parser.end();

    const trimmedTrackLists = trackLists.map(tl => tl.slice(0,limit));

    trimmedTrackLists.forEach(list => {
      list.forEach((t, idx) => {
        const weight = limit - idx;
        let track = t.trimRight().trimLeft().toLowerCase();

        if (track.indexOf('\n') > -1) {
          const splittedTrack = track.split('\n');
          track = splittedTrack[0];
        }

        const similarTrack = Object.keys(result).reduce((prev, curr) => {
          const distanceCurr = levenshtein.get(track, curr);

          if (prev === '') return curr;
          else {
            const distancePrev = levenshtein.get(track, prev);
            return distancePrev > distanceCurr ? curr : prev;
          }
        }, '');

        const distanceSimilar = levenshtein.get(track, similarTrack);
        const finalTrack = distanceSimilar < 2 ? similarTrack : track;

        if (result[finalTrack]) {
          const currentWeight = result[finalTrack];
          result[finalTrack] = currentWeight + weight;
        } else {
          result[finalTrack] = weight;
        }
      })
    });

    var sortable = [];

    for (var track in result) {
      sortable.push([track, result[track]]);
    }

    const sortedResult = sortable.sort((a, b) => b[1] - a[1]);

    const unparsedIds = unparsedComments.map(uc => uc.id);

    req.session.result = sortedResult;

    return res.status(200).json(unparsedIds);
  })
  .catch(err => {
    console.log(err);
    return res.status(404).send('Please provide a valid Post Id.');
  });
});

app.get('/download_csv', (req, res) => {
  const result = req.session.result;

  return req.session.destroy(function(err){
    if(err){
        return res.status(500).send('Something went wrong.');
    } else {
      if (!result) return res.status(400).send('No result session available.');

      stringify(result, (err, data) => {
        if (err) {
          return res.status(404).send('Failed converting result to CSV.');
        }

        res.setHeader('Content-Disposition', 'attachment; filename=result.csv');
        res.set('Content-Type', 'text/csv');
        return res.status(200).send(data);
      });
    }
  });
});

app.get('/*', (req, res) => res.sendFile(global.rootPath + '/public/index.html'));

//Error handling
app.use(function(err, req, res, next) {
  console.error(err.stack);
  res.status(500).send('Something broke!');
});

module.exports = app;
