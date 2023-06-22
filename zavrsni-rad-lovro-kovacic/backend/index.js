const express = require('express');
const app = express();
const port = 4000
const cors = require('cors');

const { Pool } = require('pg');

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cors());

app.get('/question/:question_id/:academic_year', cors(), async (req, res) => {
  const questionId = req.params.question_id;
  const academicYear = req.params.academic_year;


  try {
    const client = await pool.connect();
    const result = await client.query(` WITH question_stats AS (
      SELECT
        id_question,
        sum(case when is_correct then 1 else 0 end) AS tocnih,
        sum(case when is_incorrect then 1 else 0 end) AS netocnih,
        sum(case when is_partial then 1 else 0 end) AS parcijalnih,
        sum(case when is_unanswered then 1 else 0 end) AS neodgovorenih,
        (count(*) ) AS odgovaralo
      from
        test_instance_question
        JOIN test_instance ON test_instance_question.id_test_instance = test_instance.id
          and ts_submitted is not null
      where
        id_question = $1
      group by id_question
    )
   
  SELECT
    id_academic_year,
    question_answer.ordinal,
    question_answer.is_correct,
    SUM(CASE WHEN (answers_permutation[one_answer] = question_answer.ordinal) THEN 1 ELSE 0 END) AS num,
   
    100. * SUM(CASE WHEN (answers_permutation[one_answer] = question_answer.ordinal AND question_answer.is_correct) THEN 1 ELSE 0 END) / odgovaralo AS correct,
    100. * SUM(CASE WHEN (answers_permutation[one_answer] = question_answer.ordinal AND NOT question_answer.is_correct) THEN 1 ELSE 0 END) / odgovaralo AS incorrect,
   
    100. * neodgovorenih / (odgovaralo) AS unanswered
   
  from  test_instance_question
    JOIN test_instance ON test_instance_question.id_test_instance = test_instance.id
    JOIN test ON test_instance.id_test = test.id
    JOIN question_answer  ON question_answer.id_question = test_instance_question.id_question
    JOIN question_stats ON 1 = 1
    JOIN unnest(student_answers) AS one_answer ON 1 = 1
   
  WHERE
    test_instance_question.id_question = question_stats.id_question and id_academic_year = $2
   
  GROUP BY id_academic_year, question_answer.ordinal,  question_answer.is_correct, odgovaralo, neodgovorenih`, [questionId, academicYear]);

    client.release();

    let unanswered = parseFloat(result.rows[0].unanswered);
    let correct = parseFloat(result.rows[0].correct);
    let incorrect = parseFloat(result.rows[0].incorrect);
    let num = parseInt(result.rows[0].num);

    let totalNum = 0

    if (correct === 0) {
      totalNum = (num * 100) / incorrect;
    } else {
      totalNum = (num * 100) / correct;
    }

    result.rows.push(
      {
      "id_academic_year": parseInt(academicYear),
      "ordinal": null,
      "is_correct": false,
      "num": String(Math.round(totalNum * (unanswered / 100))),
      "correct": '0',
      "incorrect": '0',
      "unanswered": result.rows[0].unanswered
      }
    );
  

    res.json(result.rows);
  } catch (error) {
    res.status(500).send('Error retrieving data from the database.');
    console.error(error);
  }
});

app.get('/percentages/all/exams', cors(), async (req, res) => {
  res.json(allExams);
})


// app.get("/instances/MI", cors(), (req, res) => {
//   res.json(BP_MI_instances);
// })

app.get("/instances/:testID/:academic_year/:courseID", cors(), async (req, res) => {
  const testID = req.params.testID;
  const academicYear = req.params.academic_year;
  const courseID = req.params.courseID;

  try {
    const client = await pool.connect();
    const result = await client.query(`
    SELECT test_instance.*,
                to_json(ts_started) as ts_started,
                to_json(ts_submitted) as ts_submitted,
                test.ts_available_from, test.ts_available_to
                FROM test_instance
                    JOIN test
                    ON test_instance.id_test = test.id AND test.id = $1
                    WHERE test.id_course = $2 AND test.id_academic_year = $3
                    `, [testID, courseID, academicYear]);
    
    client.release();

    res.json(result.rows);

  } catch (error) {
    res.status(500).send('Error retrieving data from the database.');
    console.error(error);
  }
})

app.get("/results/:testID/:academic_year/:courseID", cors(), async (req, res) => {
  const testID = req.params.testID;
  const academicYear = req.params.academic_year;
  const courseID = req.params.courseID;

  try {
    const client = await pool.connect();

    const result = await client.query(`SELECT ROUND(perc, 2) as percentage, COUNT(ROUND(perc, 2)) as student_count
    FROM
        (SELECT GREATEST(0, score_perc) as perc
        FROM test_instance
        JOIN test
        ON test_instance.id_test = test.id AND test.id = $1
        WHERE test.id_course = $2 AND test.id_academic_year = $3) as result
    GROUP BY percentage`, [testID, courseID, academicYear]);

    client.release();

    res.json(result.rows);

  } catch (error) {
    res.status(500).send('Error retrieving data from the database.');
    console.error(error);

  }
})

app.get("/passed/percentage/:testID/:academic_year/:courseID", cors(), async (req, res) => { 
  const testID = req.params.testID;
  const academicYear = req.params.academic_year;
  const courseID = req.params.courseID;

  try {
    const client = await pool.connect();

    const result = await client.query(`SELECT
    round(SUM(CASE WHEN(passed = true) THEN 1.0 ELSE 0 END)::numeric/COUNT(id_test), 2) AS passed
FROM test_instance
    JOIN test
    ON test_instance.id_test = test.id
    WHERE id_test = $1 AND test.id_academic_year = $2 AND test.id_course = $3
    GROUP BY id_test`, [testID, academicYear, courseID]);

    client.release();



    var passed = result.rows[0].passed;
    var failed = 1 - passed;

    console.log(passed, failed)

    var percResultsArray = [
      {
      'title': 'Passed', 'percentage': Math.round(passed * 100) / 100
       }, {
      'title': 'Failed', 'percentage': Math.round(failed * 100) / 100
      }
    ]

    res.json(percResultsArray);

  } catch (error) {
    res.status(500).send('Error retrieving data from the database.');
    console.error(error);
  }
})

app.get("/courses", cors(), async (req, res) => {
  try {
    const client = await pool.connect();

    const result = await client.query(`select id, course_name, course_acronym from course
    order by id desc
    limit 20;`);

    client.release();

    res.json(result.rows);

  }
  catch (error) {
    res.status(500).send('Error retrieving courses!');
    console.error(error);
  }
})

app.get("/years", cors(), async (req, res) => {
  try {
    const client = await pool.connect();

    const result = await client.query(`select id, title from academic_year order by id desc`);

    client.release();

    res.json(result.rows);

  }
  catch (error) {
    res.status(500).send('Error retrieving years!');
    console.error(error);
  }
})

app.get("/exams/:courseID/:academicYearID", cors(), async (req, res) => {

  const courseID = req.params.courseID;
  const academicYearID = req.params.academicYearID;


  try {
    const client = await pool.connect();

    const result = await client.query(
      `SELECT test.id, test.title, test.title_abbrev,
      array_agg(ROUND(GREATEST(0, score_perc), 2)) AS scores
      FROM test_instance
      JOIN test
      ON test_instance.id_test = test.id
      WHERE test.id_academic_year = $1 AND test.id_course = $2
      AND test.title_abbrev <> ''
      AND test.title_abbrev IS NOT NULL
      AND NOT test_score_ignored
      GROUP BY test.id, test.title
      ORDER BY test.test_ordinal`, [academicYearID, courseID ]);
    
    client.release();
    res.json(result.rows);

  } catch (error) {
    res.status(500).send('Error retrieving exams!');
    console.error(error);
  }
})

app.get("/questions/:testID/:academicYearID/:courseID", cors(), async (req, res) => {
  const testID = req.params.testID;
  const academicYearID = req.params.academicYearID;
  const courseID = req.params.courseID;

  try {
    const client = await pool.connect();

    const result = await client.query(`SELECT DISTINCT test_instance_question.id_question, question_type.type_name, question_type.id
    FROM
	question JOIN question_type
	ON question.id_question_type = question_type.id
	JOIN test_instance_question
	ON test_instance_question.id_question = question.id
	 JOIN test_instance
    ON test_instance_question.id_test_instance = test_instance.id
    JOIN test
      ON test.id = test_instance.id_test AND test.id = $1
      where test.id_course = $2 AND test.id_academic_year = $3
    order by question_type.id, id_question`, [testID, courseID, academicYearID]);

    client.release();
  
    res.json(result.rows);

  } catch (error) {
    res.status(500).send('Error retrieving questions!');
    console.error(error);
  }
})

app.get("/question/scores/:questionID/:academicYearID", cors(), async (req, res) => {
  const questionID = req.params.questionID;
  const academicYearID = req.params.academicYearID;

  console.log(questionID, academicYearID)

  try {
    const client = await pool.connect();

    const result = await client.query(`SELECT test_instance_question.score as unrounded_score, ROUND(test_instance_question.score,
      CASE
          WHEN MAX(test_instance_question.score) OVER() <= 1 THEN 2
          WHEN MAX(test_instance_question.score) OVER() <= 10 THEN 1
          ELSE 0
      END) as score, COUNT(*)
FROM test_instance_question
JOIN question on test_instance_question.id_question = question.id
JOIN test_instance ON test_instance_question.id_test_instance = test_instance.id
JOIN test ON test.id = test_instance.id_test
WHERE test.id_academic_year = $1
AND test_instance_question.id_question = $2
AND test_instance_question.score IS NOT NULL
GROUP BY test_instance_question.score 
ORDER BY test_instance_question.score asc;

`, [academicYearID, questionID]);

    client.release();

    res.json(result.rows);

  } catch (error) {
    res.status(500).send('Error retrieving question scores!');
    console.error(error);
  }
})




const pool = new Pool({
  user: 'postgres',
  password: 'bazepodataka',
  host: 'localhost',
  port: 5432,
  database: 'aedgar',
});

app.listen(port, () => {
	console.log(`Example app listening at http://localhost:${port}`)
})
