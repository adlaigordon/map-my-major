<?php

$target_dir = getcwd() . "/uploads/";
$file_name = basename($_FILES["userfile"]["name"]);
$target_file = $target_dir . $file_name;
$uploadOk = 1;

$contents = file_get_contents($_FILES['userfile']['tmp_name']);
echo $contents;

?>