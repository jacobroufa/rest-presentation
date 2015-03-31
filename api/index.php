<?php
require 'vendor/autoload.php';

// set up the database
$db = mysql_connect( 'localhost', 'rest', 'password' );
mysql_select_db( 'rest' );

// start slim
$app = new \Slim\Slim();

// make sure were serving up json
$res = $app->response();
$res['Content-Type'] = 'application/json';

// fetch the whole collection
$app->get( '/slides', function()
{
  $slides = array();
  $sqlSlides = "SELECT * FROM slides ORDER BY id";
  $resSlides = mysql_query( $sqlSlides );

  while ( $slide = mysql_fetch_assoc( $resSlides ) )
  {
    $slides[] = $slide;
  }

  echo json_encode( $slides );
});

// make a new slide
$app->post( '/slides', function() use ( $app )
{
  $slide = json_decode( $app->request()->getBody());

  $first_title = $slide->first_title ? $slide->first_title : NULL;
  $title = $slide->title ? $slide->title : NULL;
  $subtitle = $slide->subtitle ? $slide->subtitle : NULL;
  $body = $slide->body ? $slide->body : NULL;
  $byline = $slide->byline ? $slide->byline : NULL;

  $sqlSlide = "INSERT INTO slides
               ( first_title, title, subtitle, body, byline )
               VALUES
               ( '" . mysql_escape_string( $first_title ) . "',
                 '" . mysql_escape_string( $title ) . "',
                 '" . mysql_escape_string( $subtitle ) . "',
                 '" . mysql_escape_string( $body ) . "',
                 '" . mysql_escape_string( $byline ) . "' )";
  $resSlide = mysql_query( $sqlSlide );

  $sqlId = "SELECT MAX( id ) AS id FROM slides";
  $resId = mysql_query( $sqlId );
  $rowId = mysql_fetch_assoc( $resId );

  $slide->id = $rowId['id'];

  echo json_encode( $slide );
});

// search the slides -- not implemented in client
$app->get( '/slides/search/:field/:string', function( $field, $string )
{
  $sqlSlide = "SELECT * FROM slides WHERE " . $field . " LIKE '%" . $string . "%'";
  $resSlide = mysql_query( $sqlSlide );

  $slide = mysql_fetch_assoc( $resSlide );

  echo json_encode( $slide );
});

// get a specific slide
$app->get( '/slides/:id', function( $id )
{
  $sqlSlide = "SELECT * FROM slides WHERE id='" . $id . "'";
  $resSlide = mysql_query( $sqlSlide );

  $slide = mysql_fetch_assoc( $resSlide );

  echo json_encode( $slide );
});

// update a specific slide
$app->put( '/slides/:id', function( $id ) use ( $app )
{
  $sqlGetSlide = "SELECT * FROM slides WHERE id=$id";
  $resGetSlide = mysql_query( $sqlGetSlide );
  $getSlide = mysql_fetch_assoc( $resGetSlide );

  $slide = json_decode( $app->request()->getBody() );

  $first_title = isset($slide->first_title) ? $slide->first_title : $getSlide['first_title'];
  $title = isset($slide->title) ? $slide->title : $getSlide['title'];
  $subtitle = isset($slide->subtitle) ? $slide->subtitle : $getSlide['subtitle'];
  $body = isset($slide->body) ? $slide->body : $getSlide['body'];
  $byline = isset($slide->byline) ? $slide->byline : $getSlide['byline'];

  $sqlSlide = "UPDATE slides
    SET first_title='$first_title',
        title='$title',
        subtitle='$subtitle',
        body='$body',
        byline='$byline'
    WHERE id='$id'";
  $resSlide = mysql_query( $sqlSlide );

  echo json_encode( $slide );
});

// delete a specific slide
$app->delete( '/slides/:id', function( $id )
{
  $sqlSlide = "DELETE FROM slides WHERE id=$id";
  $resSlide = mysql_query( $sqlSlide );
});

// kick it off!
$app->run();

?>
