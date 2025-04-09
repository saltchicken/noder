from typing import Tuple, Union, List
import asyncio
import os

from node_utils import Node

from dataclasses import dataclass


@dataclass
class CaptionedImage:
    image: str
    caption: str


@dataclass
class CaptionedVideo:
    video: str
    caption: str


class CaptionedVideoSource(Node):
    async def run(self) -> CaptionedVideo:
        video_upload = self.widgets[0]  # {"type": "video_file_upload", "value": ""}
        caption = self.widgets[1]
        captioned_video = CaptionedVideo(video_upload, caption)
        return captioned_video


class CaptionedImageSource(Node):
    async def run(self) -> CaptionedImage:
        image_upload = self.widgets[0]  # {"type": "image_file_upload", "value": ""}
        caption = self.widgets[1]
        captioned_image = CaptionedImage(image_upload, caption)
        return captioned_image


class SaveCaptionedMedia(Node):
    async def run(
        self,
        captioned_images: Union[CaptionedImage, List[CaptionedImage]] = None,
        captioned_videos: Union[CaptionedVideo, List[CaptionedVideo]] = None,
    ) -> Tuple[str, List[str]]:
        import base64
        import os
        from datetime import datetime
        from io import BytesIO
        from PIL import Image

        # TODO: Handle if nothing is passed to the input

        # Create output directory if it doesn't exist
        base_output_dir = os.path.join("output")
        output_dir = self.widgets[0]
        full_output_dir = os.path.join(base_output_dir, output_dir)

        if not os.path.exists(full_output_dir):
            os.makedirs(full_output_dir)

        saved_paths = []

        # Handle images if present
        if captioned_images is not None:
            images = (
                [captioned_images]
                if isinstance(captioned_images, CaptionedImage)
                else captioned_images
            )

            for idx, img_data in enumerate(images):
                base64_data = img_data.image.split(",")[1]
                image_data = base64.b64decode(base64_data)
                img = Image.open(BytesIO(image_data))

                timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
                filename = f"image_{timestamp}_{idx}"

                image_filename = f"{filename}.png"
                output_path = os.path.join(full_output_dir, image_filename)
                img.save(output_path)

                text_filename = f"{filename}.txt"
                text_path = os.path.join(full_output_dir, text_filename)
                with open(text_path, "w") as f:
                    f.write(img_data.caption)

                saved_paths.append(output_path)

        # Handle videos if present
        if captioned_videos is not None:
            videos = (
                [captioned_videos]
                if isinstance(captioned_videos, CaptionedVideo)
                else captioned_videos
            )

            for idx, video_data in enumerate(videos):
                base64_data = video_data.video.split(",")[1]
                video_bytes = base64.b64decode(base64_data)

                timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
                filename = f"video_{timestamp}_{idx}"

                video_filename = f"{filename}.mp4"
                video_path = os.path.join(full_output_dir, video_filename)
                with open(video_path, "wb") as f:
                    f.write(video_bytes)

                text_filename = f"{filename}.txt"
                text_path = os.path.join(full_output_dir, text_filename)
                with open(text_path, "w") as f:
                    f.write(video_data.caption)

                saved_paths.append(video_path)

        return full_output_dir, saved_paths


class CondaCommand(Node):
    async def run(self, command: str) -> Tuple[str, str]:
        conda_env = self.widgets[0]  # Name of conda environment
        working_dir = self.widgets[1]  # Working directory (optional)
        status = self.widgets[2]  # {"type": "textarea", "value": ""}

        # Construct the conda run command
        conda_exec = os.path.join(os.environ.get("CONDA_EXE", "conda"))
        full_command = f"{conda_exec} run -n {conda_env} {command}"

        try:
            # Run the command asynchronously
            process = await asyncio.create_subprocess_shell(
                full_command,
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE,
                cwd=working_dir if working_dir else None,
            )

            # Wait for the command to complete and get output
            stdout, stderr = await process.communicate()

            # Decode the output
            stdout_str = stdout.decode() if stdout else ""
            stderr_str = stderr.decode() if stderr else ""

            # Update status widget with output
            status_text = f"Exit code: {process.returncode}\n\nSTDOUT:\n{stdout_str}\n\nSTDERR:\n{stderr_str}"
            await self.update_widget("status", status_text)

            if process.returncode != 0:
                raise Exception(
                    f"Command failed with exit code {process.returncode}\n{stderr_str}"
                )

            return stdout_str, stderr_str

        except Exception as e:
            error_msg = f"Error running command: {str(e)}"
            await self.update_widget("status", error_msg)
            raise


class WanVideoTrainer(Node):
    async def run(self, dataset_path: str) -> str:
        import os
        import toml

        output_path = self.widgets[0]
        output_dir = self.widgets[1]
        path_to_wan_video = self.widgets[2]

        if os.path.exists(output_path):
            # await self.set_status("Output path already exists. Please choose a different path.")
            print("output path already exists.")
            return None

        print("Creating output directory if it doesn't exist")
        os.makedirs(output_path, exist_ok=True)

        dataset_config = create_dataset_toml(dataset_path)

        # Write the TOML file
        with open(os.path.join(output_path, "dataset.toml"), "w") as f:
            toml.dump(dataset_config, f)

        config = create_wan_video_toml(
            output_dir=output_dir,
            dataset_path=dataset_path,
            model_ckpt_path=path_to_wan_video,
        )

        with open(os.path.join(output_path, "wan_video.toml"), "w") as f:
            toml.dump(config, f)

        return output_path


def create_dataset_toml(
    directory_path: str,
    resolutions: List[int] = [256],
    min_ar: float = 0.5,
    max_ar: float = 2.0,
    num_ar_buckets: int = 7,
    frame_buckets: List[int] = [1, 33],
    num_repeats: int = 5,
) -> dict:
    """
    Creates a dataset.toml file for training configuration.

    Args:
        output_path: Path where to save the TOML file
        directory_path: Path to the input directory
        resolutions: List of resolution values
        min_ar: Minimum aspect ratio
        max_ar: Maximum aspect ratio
        num_ar_buckets: Number of aspect ratio buckets
        frame_buckets: List of frame bucket values
        num_repeats: Number of repeats for directory

    Returns:
        dict: TOML file
    """

    dataset_config = {
        "resolutions": resolutions,
        "min_ar": min_ar,
        "max_ar": max_ar,
        "num_ar_buckets": num_ar_buckets,
        "frame_buckets": frame_buckets,
        "directory": {"path": directory_path, "num_repeats": num_repeats},
    }

    return dataset_config


def create_wan_video_toml(
    output_dir: str,
    dataset_path: str,
    epochs: int = 100,
    micro_batch_size: int = 1,
    pipeline_stages: int = 1,
    gradient_accumulation_steps: int = 4,
    gradient_clipping: float = 1.0,
    warmup_steps: int = 100,
    eval_every_n_epochs: int = 1,
    save_every_n_epochs: int = 5,
    checkpoint_every_n_minutes: int = 30,
    model_ckpt_path: str = "/path/to/Wan2.1-T2V-14B-480P",
    learning_rate: float = 2e-5,
    weight_decay: float = 0.01,
) -> dict:
    """
    Creates a wan_video.toml file for training configuration.

    Args:
        output_path: Path where to save the TOML file
        output_dir: Directory for output files
        dataset_path: Path to the dataset.toml file
        epochs: Number of training epochs
        micro_batch_size: Micro batch size per GPU
        pipeline_stages: Number of pipeline stages
        gradient_accumulation_steps: Number of gradient accumulation steps
        gradient_clipping: Gradient clipping value
        warmup_steps: Number of warmup steps
        eval_every_n_epochs: Evaluation frequency in epochs
        save_every_n_epochs: Model saving frequency in epochs
        checkpoint_every_n_minutes: Checkpoint saving frequency in minutes
        model_ckpt_path: Path to the model checkpoint
        learning_rate: Learning rate for training
        weight_decay: Weight decay for optimizer

    Returns:
        dict: TOML file
    """

    config = {
        "output_dir": output_dir,
        "dataset": dataset_path,
        "epochs": epochs,
        "micro_batch_size_per_gpu": micro_batch_size,
        "pipeline_stages": pipeline_stages,
        "gradient_accumulation_steps": gradient_accumulation_steps,
        "gradient_clipping": gradient_clipping,
        "warmup_steps": warmup_steps,
        "eval_every_n_epochs": eval_every_n_epochs,
        "eval_before_first_step": True,
        "eval_micro_batch_size_per_gpu": micro_batch_size,
        "eval_gradient_accumulation_steps": 1,
        "save_every_n_epochs": save_every_n_epochs,
        "checkpoint_every_n_minutes": checkpoint_every_n_minutes,
        "activation_checkpointing": True,
        "partition_method": "parameters",
        "save_dtype": "bfloat16",
        "caching_batch_size": 1,
        "steps_per_print": 1,
        "video_clip_mode": "single_middle",
        "model": {
            "type": "wan",
            "ckpt_path": model_ckpt_path,
            "dtype": "bfloat16",
            "transformer_dtype": "float8",
            "timestep_sample_method": "logit_normal",
        },
        "adapter": {"type": "lora", "rank": 32, "dtype": "bfloat16"},
        "optimizer": {
            "type": "adamw_optimi",
            "lr": learning_rate,
            "betas": [0.9, 0.99],
            "weight_decay": weight_decay,
            "eps": 1e-8,
        },
    }

    return config
